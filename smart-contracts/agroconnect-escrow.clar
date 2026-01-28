;; AgroConnect Escrow Smart Contract for Stacks (Clarity)
;; This contract manages STX payments for agricultural orders with escrow functionality

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-UNAUTHORIZED (err u401))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-INVALID-AMOUNT (err u400))
(define-constant ERR-ALREADY-RELEASED (err u409))
(define-constant ERR-TIMEOUT-NOT-REACHED (err u410))

;; Data maps to store escrow records
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

;; Map to track dispute claims
(define-map disputes
  { order-id: (string-utf8 256) }
  {
    claimant: principal,
    reason: (string-utf8 512),
    created-at: uint,
    resolved: bool
  }
)

;; Create an escrow deposit for an order
(define-public (create-escrow
  (order-id (string-utf8 256))
  (farmer principal)
  (amount uint)
)
  (begin
    ;; Verify amount is positive
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    
    ;; Check if escrow already exists
    (asserts! (is-none (map-get? escrows { order-id: order-id })) (err u411))
    
    ;; Transfer STX from buyer to contract
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

;; Release funds to farmer (called by buyer when confirming delivery)
(define-public (release-to-farmer
  (order-id (string-utf8 256))
)
  (let (
    (escrow (unwrap! (map-get? escrows { order-id: order-id }) ERR-NOT-FOUND))
  )
    (begin
      ;; Verify caller is the buyer
      (asserts! (is-eq tx-sender (get buyer escrow)) ERR-UNAUTHORIZED)
      
      ;; Verify funds haven't already been released
      (asserts! (is-eq (get status escrow) u"pending") ERR-ALREADY-RELEASED)
      
      ;; Transfer STX to farmer
      (try! (as-contract (stx-transfer? (get amount escrow) tx-sender (get farmer escrow))))
      
      ;; Update escrow status
      (map-set escrows
        { order-id: order-id }
        (merge escrow
          {
            status: u"released",
            released-at: (some block-height)
          }
        )
      )
      
      (ok true)
    )
  )
)

;; Refund buyer if timeout is reached (30 days = ~4320 blocks at 10min per block)
(define-public (refund-buyer
  (order-id (string-utf8 256))
)
  (let (
    (escrow (unwrap! (map-get? escrows { order-id: order-id }) ERR-NOT-FOUND))
    (timeout-blocks u4320)
  )
    (begin
      ;; Verify funds haven't been released
      (asserts! (is-eq (get status escrow) u"pending") ERR-ALREADY-RELEASED)
      
      ;; Verify timeout has been reached
      (asserts!
        (>= (- block-height (get created-at escrow)) timeout-blocks)
        ERR-TIMEOUT-NOT-REACHED
      )
      
      ;; Transfer STX back to buyer
      (try! (as-contract (stx-transfer? (get amount escrow) tx-sender (get buyer escrow))))
      
      ;; Update escrow status
      (map-set escrows
        { order-id: order-id }
        (merge escrow
          {
            status: u"refunded",
            released-at: (some block-height)
          }
        )
      )
      
      (ok true)
    )
  )
)

;; Get escrow details
(define-read-only (get-escrow
  (order-id (string-utf8 256))
)
  (map-get? escrows { order-id: order-id })
)

;; Check escrow status
(define-read-only (get-escrow-status
  (order-id (string-utf8 256))
)
  (match (map-get? escrows { order-id: order-id })
    escrow (ok (get status escrow))
    (err u404)
  )
)

;; Get contract balance
(define-read-only (get-balance)
  (as-contract (stx-get-balance tx-sender))
)

;; Dispute claim - buyer can claim delivery never happened
(define-public (file-dispute
  (order-id (string-utf8 256))
  (reason (string-utf8 512))
)
  (let (
    (escrow (unwrap! (map-get? escrows { order-id: order-id }) ERR-NOT-FOUND))
  )
    (begin
      ;; Verify caller is the buyer
      (asserts! (is-eq tx-sender (get buyer escrow)) ERR-UNAUTHORIZED)
      
      ;; Create dispute record
      (map-set disputes
        { order-id: order-id }
        {
          claimant: tx-sender,
          reason: reason,
          created-at: block-height,
          resolved: false
        }
      )
      
      (ok true)
    )
  )
)

;; Get dispute details (for admin review)
(define-read-only (get-dispute
  (order-id (string-utf8 256))
)
  (map-get? disputes { order-id: order-id })
)
