;; Fillo Escrow Smart Contract (Clarity v2)

;; ---------------------------------------------------------
;; OWNER (v2-safe)
;; ---------------------------------------------------------
(define-data-var contract-owner principal tx-sender)

;; ---------------------------------------------------------
;; ERRORS
;; ---------------------------------------------------------
(define-constant ERR-UNAUTHORIZED (err u401))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-INVALID-AMOUNT (err u400))
(define-constant ERR-ALREADY-RELEASED (err u409))
(define-constant ERR-TIMEOUT-NOT-REACHED (err u410))
(define-constant ERR-ESCROW-EXISTS (err u411))
(define-constant ERR-DISPUTE-RESOLVED (err u412))
(define-constant ERR-INVALID-RESOLUTION (err u413))
(define-constant ERR-NOT-DISPUTED (err u414))
(define-constant ERR-DISPUTE-ACTIVE (err u415))

;; ---------------------------------------------------------
;; DATA
;; ---------------------------------------------------------
(define-map escrows
  { order-id: (string-utf8 256) }
  {
    buyer: principal,
    farmer: principal,
    amount: uint,
    status: (string-utf8 32),
    created-at: uint,
    released-at: (optional uint)
  }
)

(define-map disputes
  { order-id: (string-utf8 256) }
  {
    claimant: principal,
    reason: (string-utf8 512),
    created-at: uint,
    resolved: bool
  }
)

;; ---------------------------------------------------------
;; CREATE ESCROW
;; ---------------------------------------------------------
(define-public (create-escrow
  (order-id (string-utf8 256))
  (farmer principal)
  (amount uint)
)
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (is-none (map-get? escrows { order-id: order-id })) ERR-ESCROW-EXISTS)

    ;; buyer -> contract
    (try!
      (stx-transfer? amount tx-sender (as-contract tx-sender))
    )

    (map-set escrows { order-id: order-id }
      {
        buyer: tx-sender,
        farmer: farmer,
        amount: amount,
        status: u"pending",
        created-at: stacks-block-height,
        released-at: none
      }
    )
    (ok true)
  )
)

;; ---------------------------------------------------------
;; RELEASE TO FARMER
;; ---------------------------------------------------------
(define-public (release-to-farmer (order-id (string-utf8 256)))
  (let ((escrow (unwrap! (map-get? escrows { order-id: order-id }) ERR-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender (get buyer escrow)) ERR-UNAUTHORIZED)
      (asserts! (is-eq (get status escrow) u"pending") ERR-ALREADY-RELEASED)

      (as-contract
        (try!
          (stx-transfer?
            (get amount escrow)
            tx-sender
            (get farmer escrow)
          )
        )
      )

      (map-set escrows { order-id: order-id }
        (merge escrow {
          status: u"released",
          released-at: (some stacks-block-height)
        })
      )
      (ok true)
    )
  )
)

;; ---------------------------------------------------------
;; REFUND BUYER
;; ---------------------------------------------------------
(define-public (refund-buyer (order-id (string-utf8 256)))
  (let (
        (escrow (unwrap! (map-get? escrows { order-id: order-id }) ERR-NOT-FOUND))
        (timeout-blocks u4320)
       )
    (begin
      (asserts! (is-eq (get status escrow) u"pending") ERR-DISPUTE-ACTIVE)
      (asserts!
        (>= (- stacks-block-height (get created-at escrow)) timeout-blocks)
        ERR-TIMEOUT-NOT-REACHED
      )

      (as-contract
        (try!
          (stx-transfer?
            (get amount escrow)
            tx-sender
            (get buyer escrow)
          )
        )
      )

      (map-set escrows { order-id: order-id }
        (merge escrow {
          status: u"refunded",
          released-at: (some stacks-block-height)
        })
      )
      (ok true)
    )
  )
)

;; ---------------------------------------------------------
;; FILE DISPUTE
;; ---------------------------------------------------------
(define-public (file-dispute
  (order-id (string-utf8 256))
  (reason (string-utf8 512))
)
  (let ((escrow (unwrap! (map-get? escrows { order-id: order-id }) ERR-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender (get buyer escrow)) ERR-UNAUTHORIZED)
      (asserts! (is-eq (get status escrow) u"pending") ERR-ALREADY-RELEASED)

      (map-set disputes { order-id: order-id }
        {
          claimant: tx-sender,
          reason: reason,
          created-at: stacks-block-height,
          resolved: false
        }
      )

      (map-set escrows { order-id: order-id }
        (merge escrow { status: u"disputed" })
      )
      (ok true)
    )
  )
)

;; ---------------------------------------------------------
;; RESOLVE DISPUTE (ADMIN)
;; ---------------------------------------------------------
(define-public (resolve-dispute
  (order-id (string-utf8 256))
  (resolution (string-utf8 8))
)
  (begin
    (asserts!
      (is-eq tx-sender (var-get contract-owner))
      ERR-UNAUTHORIZED
    )

    (asserts!
      (or (is-eq resolution u"release") (is-eq resolution u"refund"))
      ERR-INVALID-RESOLUTION
    )

    (let (
          (escrow (unwrap! (map-get? escrows { order-id: order-id }) ERR-NOT-FOUND))
          (dispute (unwrap! (map-get? disputes { order-id: order-id }) ERR-NOT-FOUND))
         )
      (begin
        (asserts! (is-eq (get status escrow) u"disputed") ERR-NOT-DISPUTED)
        (asserts! (not (get resolved dispute)) ERR-DISPUTE-RESOLVED)

        (if (is-eq resolution u"release")
          (as-contract
            (try!
              (stx-transfer?
                (get amount escrow)
                tx-sender
                (get farmer escrow)
              )
            )
          )
          (as-contract
            (try!
              (stx-transfer?
                (get amount escrow)
                tx-sender
                (get buyer escrow)
              )
            )
          )
        )

        (map-set escrows { order-id: order-id }
          (merge escrow {
            status: (if (is-eq resolution u"release") u"released" u"refunded"),
            released-at: (some stacks-block-height)
          })
        )

        (map-set disputes { order-id: order-id }
          (merge dispute { resolved: true })
        )

        (ok true)
      )
    )
  )
)

