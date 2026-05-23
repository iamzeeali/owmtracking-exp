# Tracking Status Rules (Baseline)

This document captures the tracking status rules implemented in `services/trackingStatusService.js` and consumed by `client/src/components/TrackStatus.js` via `GET /api/tracking/:ecciNumber`.

## Data sources per ECCI

- ASN: `GET /api/asn?ecciNumber={ecci}`
- GRN variants:
  - Received: `transactionType=GRN`, `modeOfDelivery=MILK RUN`
  - MR Transit: `transactionType=DO`, `modeOfDelivery=MILK RUN`
  - DD Transit: `transactionType=GRN`, `modeOfDelivery=DIRECT DELIVERY`
  - DD DO: `transactionType=DO`, `modeOfDelivery=DIRECT DELIVERY`

## Field fallback precedence

- `vendorName`: ASN -> Received -> MR Transit -> DD Transit -> DD DO
- `deliveryLocation`: ASN/Received/MR/DD Transit/DD DO first non-empty of:
  - `deliveryLocation`, `deliveryLocationName`, `pickupLocation`, `pickupAddress`, `vendorAddress`
- `store`: first non-empty of `store`, `storeName` from ASN/Received/MR/DD Transit/DD DO
- `vehicleNumber`: DD DO -> DD Transit -> MR Transit -> Received -> ASN, first non-empty of:
  - `vehicleNumber`, `vehicleNo`, `vechileNumber`, `details.vehicleNumber`
- `warehouse`: first non-empty from ASN/Received/MR/DD Transit/DD DO:
  - `warehouse`, `collectionLocation`, `pickupLocation`, `pickupAddress`, `vendorAddress`
- `collectionLocationCode`:
  - `JSR` if warehouse string contains `JSR` (case-insensitive)
  - otherwise `KOL`
  - if warehouse is unavailable, return `N/A`

## Date rules

- Frontend helper `increaseDateBy1(date, manual)`:
  - if `manual` is falsy: `date + 1 day`
  - else: unchanged
- Planned date = ASN upload date passed through `increaseDateBy1`
- Picked date:
  - first available `inDate` from MR Transit -> Received -> DD Transit -> DD DO
  - passed through `increaseDateBy1` with matching `manual`
- Received-at-crossdock date:
  - first available `inDate` from MR Transit -> Received
  - passed through `increaseDateBy1`
- Dispatched date:
  - first available `transDate` from MR Transit -> Received
  - passed through `increaseDateBy1`

## Delivery ETA and delivered state

1. Delivery base source date (`transDateFromReport`) picks first:
   - MR Transit `transDate`
   - Received `transDate`
   - DD DO `transDate`
   - DD Transit `transDate`
2. Apply `increaseDateBy1` to `transDateFromReport`.
3. Convert to date and add:
   - +2 days if day is Saturday
   - else +1 day
4. Convert to display format `DD-MMM-YYYY`.

Special case for delivery location containing `TSM`:
- Display/comparison date becomes dispatch fallback + 3 days, where dispatch fallback first picks:
  - `transDate` from MR Transit -> Received -> DD Transit -> DD DO -> ASN
  - else `inDate` from same order
- If no dispatch fallback is available, use previously computed delivery date + 3 days.

Delivered condition:
- `isDelivered = now is after displayComparisonDate by day`.
- On the display day itself, status remains expected (not delivered).

## Timeline visibility/completion

- Planned step: complete when ASN exists.
- Picked step: complete when any GRN variant exists (MR Transit/Received/DD Transit/DD DO).
- Received-at-crossdock step:
  - hidden when DD Transit or DD DO exists
  - otherwise complete when MR Transit or Received exists
- Dispatched-from-crossdock step:
  - shown as complete only when any GI number exists and not in DD path
  - GI check uses any of: Received `giNumber`, MR Transit `giNumber`, DD Transit `giNumber`, DD DO `giNumber`
- Expected/Delivered-at-Tata-Steel step:
  - active when any GI number exists
  - label is `Expected Delivery at Tata Steel` while `!isDelivered`
  - label is `Delivered at Tata Steel` when `isDelivered`
