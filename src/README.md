Lossless Lottery is a decentralized app launched on Algorand. This project was done as part of August 2022 Greenhouse Hack Algorand Foundation Bounty Hack. The front end is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

**Developed by**: [Sunday Akinbowale](https://github.com/asolpshinning)

## Video Demo
[Here](https://vimeo.com/742076931/9ab7bddbdb)


## Notes
- The smart contract was built using [Reachlang](reach.sh)
- More explanations about how the contract works is in the video demo above
- The reach smart contract is located [here](https://github.com/asolpshinning/lossless-lottery-gAlgo/tree/main/src/rsh)
- The compiled javascript file from reach is [here](https://github.com/asolpshinning/lossless-lottery-gAlgo/tree/main/src/reachBackend)
- You can easily test this when you `cd` to `src` folder and `npm run dev` the next JS project



## ABI
```json
{
  "name": "Lossless Lottery gAlgo",
  "desc": "Smart Contract for Weekly Lottery During Algorand Governance Commitment Period",
  "methods": [
    {
      "name": "mintgAlgo",
      "desc": "mint gAlgo for Algo (1 gAlgo = 1 Algo)",
      "args": [
        { "type": "uint64", "desc": "Amount of gAlgo to be minted" },
      ],
      "returns": { "type": "boolean", "desc": "failure or success" }
    },
    {
      "name": "getTickets",
      "desc": "After you are done minting all gAlgos you want, use this to get lottery tickets",
      "args": [
      ],
      "returns": { "type": "boolean", "desc": "failure or success" }
    },
    {
      "name": "getRandomWinner",
      "desc": "Only the Contract Creator or Manager can use this to get the random winning ticket",
      "args": [
        { "type": "uint64", "desc": "Random number the contract uses to choose the winner" },
      ],
      "returns": { "type": "boolean", "desc": "failure or success" }
    },
    {
      "name": "claimRewards",
      "desc": "Participators use this weekly to claim their lottery rewards if they have the winning ticket",
      "args": [
      ],
      "returns": { "type": "boolean", "desc": "failure or success" }
    },
    {
      "name": "startCommitmentPeriod",
      "desc": "Only the admin uses this to start commitment period when people can no longer mint gAlgos for their Algos",
      "args": [
      ],
      "returns": { "type": "boolean", "desc": "failure or success" }
    },
    {
      "name": "deployContract",
      "desc": "This just contains some information useful for Admin for what is needed to deploy the smart contract",
      "args": [
        { "type": "token", "name": "gAlgo", "desc": "gAlgo token ID" },
        { "type": "Address", "name": "Manager", "desc": "Address of an admin manager for the contract (either the same or different from Creator" },
        { "type": "UInt64", "name": "minimumForTicket", "desc": "minimum amount of gAlgo to be minted before being able to receive lottery tickets" },
        { "type": "UInt64", "name": "weeklyPercent", "desc": "this is the percentage used to determine weekly amount of lottery rewards for winners" },
        { "type": "UInt64", "name": "gAlgoAdminSupply", "desc": "this is the amount of gAlgo the Contract Creator pays into the contract at the launch of the contract" },
      ],
      "returns": { "type": "boolean", "desc": "failure or success" }
    },
    
  ]
}
```
## Contract Info
``` javaScript

const _ALGO = {
  ABI: {
    impure: [`claimRewards(uint64)byte`, `getRandomWinner(uint64)byte`, `getTickets()byte`, `mintgAlgo(uint64)byte`, `startCommitmentPeriod()byte`],
    pure: [`Creator_v()address`, `Manager_v()address`, `balance_gAlgo_v()uint64`, `balance_v()uint64`, `commitPeriodStarted_v()byte`, `currentPrice_v()uint64`, `mintedAmount_v(address)uint64`, `receivedTickets_v(address)byte`, `rewardsClaimed_v(uint64)byte`, `ticketNumEnd_v(address)uint64`, `ticketNumStart_v(address)uint64`, `totalMinted_v()uint64`, `totalTickets_v()uint64`, `winningTicket_v(uint64)uint64`],
    sigs: [`Creator_v()address`, `Manager_v()address`, `balance_gAlgo_v()uint64`, `balance_v()uint64`, `claimRewards(uint64)byte`, `commitPeriodStarted_v()byte`, `currentPrice_v()uint64`, `getRandomWinner(uint64)byte`, `getTickets()byte`, `mintedAmount_v(address)uint64`, `mintgAlgo(uint64)byte`, `receivedTickets_v(address)byte`, `rewardsClaimed_v(uint64)byte`, `startCommitmentPeriod()byte`, `ticketNumEnd_v(address)uint64`, `ticketNumStart_v(address)uint64`, `totalMinted_v()uint64`, `totalTickets_v()uint64`, `winningTicket_v(uint64)uint64`]
    },
  appApproval: `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`,
  appClear: `Bg==`,
  companionInfo: null,
  extraPages: 1,
  mapDataKeys: 1,
  mapDataSize: 29,
  stateKeys: 3,
  stateSize: 279,
  unsupported: [],
  version: 10,
  warnings: []
  };

```

First, run the development server:


## To Run This Project

First, run the development server:

```bash
cd src
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
