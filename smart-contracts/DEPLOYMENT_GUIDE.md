# AgroConnect Stacks Smart Contract Deployment Guide

## Overview
This Clarity smart contract implements an escrow system for agricultural orders on the Stacks blockchain. It manages STX (Stacks cryptocurrency) payments with three possible outcomes:
1. **Release to Farmer** - Buyer confirms delivery and releases funds to farmer
2. **Refund to Buyer** - If timeout (30 days) is reached without release
3. **Dispute Resolution** - For contested transactions

## Contract Functions

### Public Functions

#### `create-escrow(order-id, farmer, amount)`
Locks STX in escrow for a specific order.
- **Parameters:**
  - `order-id`: Unique identifier for the order (string-utf8 256)
  - `farmer`: Principal address of the farmer
  - `amount`: Amount in microSTX (1 STX = 1,000,000 µSTX)
- **Called by:** Buyer
- **Returns:** true on success

#### `release-to-farmer(order-id)`
Releases escrowed funds to the farmer after delivery confirmation.
- **Parameters:**
  - `order-id`: Order identifier
- **Called by:** Buyer (original depositor)
- **Returns:** true on success

#### `refund-buyer(order-id)`
Returns escrowed funds to buyer after 30-day timeout.
- **Parameters:**
  - `order-id`: Order identifier
- **Called by:** Anyone (after timeout)
- **Returns:** true on success

#### `file-dispute(order-id, reason)`
Files a dispute claim for an order (if delivery never happened).
- **Parameters:**
  - `order-id`: Order identifier
  - `reason`: Dispute reason (string-utf8 512)
- **Called by:** Buyer
- **Returns:** true on success

### Read-Only Functions

#### `get-escrow(order-id)`
Returns full escrow record details.

#### `get-escrow-status(order-id)`
Returns current status: "pending", "released", or "refunded".

#### `get-dispute(order-id)`
Returns dispute details if a dispute exists.

#### `get-balance()`
Returns total STX held in contract.

## Deployment Steps

### Prerequisites
- [Stacks CLI](https://docs.stacks.co/build/cli)
- [Clarinet](https://github.com/hirosystems/clarinet)
- STX testnet funds from [faucet](https://testnet-faucet.alexgo.io/)

### Step 1: Initialize Clarinet Project
```bash
clarinet new agroconnect-escrow
cd agroconnect-escrow
```

### Step 2: Add Contract
```bash
# Copy the agroconnect-escrow.clar file to contracts/
cp agroconnect-escrow.clar contracts/
```

### Step 3: Test Locally
```bash
clarinet check
clarinet test
```

### Step 4: Deploy to Testnet
```bash
# Configure your testnet account in Clarinet.toml
clarinet deployments generate
clarinet deployments apply testnet
```

### Step 5: Deploy to Mainnet (Production)
```bash
clarinet deployments apply mainnet
```

## Integration with Backend

Once deployed, update your `.env` file:

```env
STACKS_NETWORK="testnet"  # or "mainnet"
STACKS_API_URL="https://api.testnet.hiro.so"
STACKS_CONTRACT_ADDRESS="ST1234..." # Your deployed contract address
STACKS_CONTRACT_NAME="agroconnect-escrow"
```

## Example: Creating an Escrow from Backend

```typescript
import { Transaction, PostConditionMode, broadcastTransaction } from '@stacks/transactions';

const escrowTx = await callReadOnlyFunction({
  contractAddress: contractAddress,
  contractName: 'agroconnect-escrow',
  functionName: 'create-escrow',
  functionArgs: [
    stringUtf8(orderId),
    standardPrincipal(farmerAddress),
    uintCV(amountInMicroSTX),
  ],
  network: testnet,
  senderAddress: buyerAddress,
});
```

## Example: Frontend Wallet Integration

Users connect their Leather or Xverse wallet and sign the transaction:

```typescript
import { openContractCall } from '@stacks/connect';

const tx = await openContractCall({
  contractAddress: process.env.STACKS_CONTRACT_ADDRESS,
  contractName: 'agroconnect-escrow',
  functionName: 'create-escrow',
  functionArgs: [
    stringUtf8(orderId),
    standardPrincipal(farmerAddress),
    uintCV(amountInMicroSTX),
  ],
  onFinish: (result) => {
    // Transaction signed and broadcast
    console.log('TX Hash:', result.txId);
  },
});
```

## Gas Costs (Testnet)
- `create-escrow`: ~150 µSTX
- `release-to-farmer`: ~130 µSTX
- `refund-buyer`: ~140 µSTX
- `file-dispute`: ~110 µSTX

## Security Considerations

1. **Reentrancy**: Safe - uses `as-contract` to isolate contract calls
2. **Timeout**: 30-day hardcoded timeout (changeable via upgrade)
3. **Access Control**: Only buyer can release or dispute their own orders
4. **Amount Validation**: Contract verifies positive amounts

## Future Enhancements

- Admin resolution for disputes
- Configurable timeout duration
- Multi-signature support for high-value orders
- Integration with DAO governance for dispute resolution

## Support
For issues or questions, refer to:
- [Stacks Documentation](https://docs.stacks.co)
- [Clarity Reference](https://docs.stacks.co/clarity)
- [Hiro Labs Examples](https://github.com/hirosystems)
