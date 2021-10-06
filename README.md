# Compound Tools

This repository contains various tooling scripts for Compound protocol.

## Setup

### Requirements
- Node
- Yarn or npm
- Git _(optional)_

### Instructions
1. Download the repository
- Git: `git clone git@github.com:TylerEther/compound-tools.git && cd compound-tools`
2. Setup the project
- Yarn: `yarn install --lock-file`
- Npm: `npm install --lock-file`

## Available Tools

### Proposal 62 Bug - Find affected accounts
This script will compute a list of accounts (Ethereum addresses) affected by the bug introduced in proposal 62.

The first outputted list is a list of tuples - transaction ID, account address, and amount over-accrued in the transaction.

The second outputted list is a list of tuples - account address, total over-accrued for that address, and their current COMP accrued.

The total amount of over-accrued COMP across all affected accounts is also outputted following the second list.

```
npx hardhat run scripts/proposal-62-bug/find-affected-accounts.js
```
