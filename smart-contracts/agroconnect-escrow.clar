;; AgroConnect Escrow Smart Contract for Stacks (Clarity)
;; This contract manages STX payments for agricultural orders with escrow functionality

(define-constant CONTRACT-OWNER tx-sender)

;; --- Error Constants
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


;; --- Data Maps & Variables
(define-map escrows
  { order-id: (string-utf8 256) }
  {
    buyer: principal,
    farmer: principal,
    amount: uint,
    status: (string-utf8 32), ;; "pending", "released", "refunded", "disputed"
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

;; --- Public Functions

;; @desc Create an escrow deposit for an order
;; @param order-id A unique identifier for the order
;; @param farmer The principal of the farmer receiving the funds
;; @param amount The amount of STX to be held in escrow
(define-public (create-escrow
  (order-id (string-utf8 256))
  (farmer principal)
  (amount uint)
)
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (is-none (map-get? escrows { order-id: order-id })) ERR-ESCROW-EXISTS)

    ;; Transfer STX from buyer (tx-sender) to this contract
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))

    ;; Create escrow record
    (map-set escrows
      { order-id: order-id }
      {
        buyer: tx-sender,
        farmer: farmer,
        amount: amount,
        status: u"pending",
        created-at: block-height,
        released-at: none
      }
    )
    (ok true)
  )
)

;; @desc Release funds to farmer (called by buyer to confirm delivery)
;; @param order-id The ID of the order to release funds for
(define-public (release-to-farmer
  (order-id (string-utf8 256))
)
  (let
    (
      (escrow (unwrap! (map-get? escrows { order-id: order-id }) ERR-NOT-FOUND))
    )
    (begin
      (asserts! (is-eq tx-sender (get buyer escrow)) ERR-UNAUTHORIZED)
      (asserts! (is-eq (get status escrow) u"pending") ERR-ALREADY-RELEASED)

      ;; Transfer STX from contract to farmer
      (try! (as-contract (stx-transfer? (get amount escrow) (as-contract tx-sender) (get farmer escrow))))

      ;; Update escrow status
      (map-set escrows { order-id: order-id }
        (merge escrow { status: u"released", released-at: (some block-height) })
      )
      (ok true)
    )
  )
)

;; @desc Refund buyer if timeout is reached (e.g., 30 days)
;; @param order-id The ID of the order to refund
(define-public (refund-buyer
  (order-id (string-utf8 256))
)
  (let
    (
      (escrow (unwrap! (map-get? escrows { order-id: order-id }) ERR-NOT-FOUND))
      (timeout-blocks u4320) ;; ~30 days
    )
    (begin
      (asserts! (is-eq (get status escrow) u"pending") ERR-DISPUTE-ACTIVE)
      (asserts! (>= (- block-height (get created-at escrow)) timeout-blocks) ERR-TIMEOUT-NOT-REACHED)

      ;; Transfer STX from contract back to buyer
      (try! (as-contract (stx-transfer? (get amount escrow) (as-contract tx-sender) (get buyer escrow))))

      (map-set escrows { order-id: order-id }
        (merge escrow { status: u"refunded", released-at: (some block-height) })
      )
      (ok true)
    )
  )
)

;; @desc File a dispute (called by buyer)
;; @param order-id The ID of the disputed order
;; @param reason A description of the dispute
(define-public (file-dispute
  (order-id (string-utf8 256))
  (reason (string-utf8 512))
)
  (let
    (
      (escrow (unwrap! (map-get? escrows { order-id: order-id }) ERR-NOT-FOUND))
    )
    (begin
      (asserts! (is-eq tx-sender (get buyer escrow)) ERR-UNAUTHORIZED)
      (asserts! (is-eq (get status escrow) u"pending") ERR-ALREADY-RELEASED)

      ;; Create dispute record
      (map-set disputes { order-id: order-id }
        {
          claimant: tx-sender,
          reason: reason,
          created-at: block-height,
          resolved: false
        }
      )

      ;; Update escrow status to "disputed"
      (map-set escrows { order-id: order-id }
        (merge escrow { status: u"disputed" })
      )
      (ok true)
    )
  )
)

;; @desc Resolve a dispute (called by CONTRACT-OWNER)
;; @param order-id The ID of the disputed order
;; @param resolution Whether to "release" to farmer or "refund" to buyer
(define-public (resolve-dispute
  (order-id (string-utf8 256))
  (resolution (string-utf8 8)) ;; "release" or "refund"
)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)

    (let
      (
        (escrow (unwrap! (map-get? escrows { order-id: order-id }) ERR-NOT-FOUND))
        (dispute (unwrap! (map-get? disputes { order-id: order-id }) ERR-NOT-FOUND))
      )
      (begin
        (asserts! (is-eq (get status escrow) u"disputed") ERR-NOT-DISPUTED)
        (asserts! (not (get resolved dispute)) ERR-DISPUTE-RESOLVED)

        (if (is-eq resolution u"release")
          ;; Release funds to the farmer
          (begin
            (try! (as-contract (stx-transfer? (get amount escrow) (as-contract tx-sender) (get farmer escrow))))
            (map-set escrows { order-id: order-id } (merge escrow { status: u"released", released-at: (some block-height) }))
          )
          ;; Refund funds to the buyer
          (if (is-eq resolution u"refund")
            (begin
              (try! (as-contract (stx-transfer? (get amount escrow) (as-contract tx-sender) (get buyer escrow))))
              (map-set escrows { order-id: order-id } (merge escrow { status: u"refunded", released-at: (some block-height) }))
            )
            (err ERR-INVALID-RESOLUTION)
          )
        )

        ;; Mark the dispute as resolved
        (map-set disputes { order-id: order-id } (merge dispute { resolved: true }))
        (ok true)
      )
    )
  )
)


;; --- Read-Only Functions
(define-read-only (get-escrow (order-id (string-utf8 256)))
  (map-get? escrows { order-id: order-id })
)

(define-read-only (get-dispute (order-id (string-utf8 256)))
  (map-get? disputes { order-id: order-id })
)

(define-read-only (get-balance)
  (stx-get-balance (as-contract tx-sender))
)
