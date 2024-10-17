;; AI Assistant Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))

;; Data Variables
(define-data-var next-token-id uint u1)

;; NFT Definitions
(define-non-fungible-token ai-knowledge uint)

;; Data Maps
(define-map token-uris {token-id: uint} {uri: (string-utf8 256)})
(define-map token-data {token-id: uint} {topic: (string-utf8 64), data: (string-utf8 1024)})

;; Mint a new AI knowledge NFT
(define-public (mint-knowledge (topic (string-utf8 64)) (data (string-utf8 1024)) (uri (string-utf8 256)))
    (let
        ((token-id (var-get next-token-id)))
        (try! (nft-mint? ai-knowledge token-id tx-sender))
        (map-set token-uris {token-id: token-id} {uri: uri})
        (map-set token-data {token-id: token-id} {topic: topic, data: data})
        (var-set next-token-id (+ token-id u1))
        (ok token-id)))

;; Update knowledge data (only by token owner)
(define-public (update-knowledge (token-id uint) (new-data (string-utf8 1024)))
    (let ((owner (unwrap! (nft-get-owner? ai-knowledge token-id) err-not-token-owner)))
        (asserts! (is-eq tx-sender owner) err-not-token-owner)
        (let ((current-data (unwrap-panic (map-get? token-data {token-id: token-id}))))
            (ok (map-set token-data {token-id: token-id}
                {topic: (get topic current-data), data: new-data})))))

;; Get knowledge data
(define-read-only (get-knowledge (token-id uint))
    (map-get? token-data {token-id: token-id}))

;; Get token URI
(define-read-only (get-token-uri (token-id uint))
    (map-get? token-uris {token-id: token-id}))

;; SIP009 NFT Interface Implementation

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
    (begin
        (asserts! (is-eq tx-sender sender) err-not-token-owner)
        (nft-transfer? ai-knowledge token-id sender recipient)))

(define-public (get-last-token-id)
    (ok (- (var-get next-token-id) u1)))

(define-read-only (get-token-owner (token-id uint))
    (ok (nft-get-owner? ai-knowledge token-id)))

(define-read-only (get-balance (account principal))
    (ok (nft-get-balance? ai-knowledge account)))
