# PolyPoll

PolyPoll is a blockhain based polling application. It allows users to create polls, vote securely, and view results transparently through the blockchain.

***Currently supports only Polygon blockchain.***

## Features

- **Create Polls:** Create new polls with custom questions, with upto 10 choices and for a maximum duration of 365 days.
- **Vote:** Users can cast votes on active polls.
- **Manage Polls:** Users can extend duration of their created polls and can also deem created polls void.
- **Share Polls:** Users can share polls with others using a poll's unique link.
- **Result Transparency:** Anyone can view poll results.
- **Security:** Each user can vote only once per poll.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) : Download and install Nodejs.
- [Visual Studio Code](https://code.visualstudio.com/) : Download and install Visual Studio Code.
- [Reown(WalletConnect)](https://cloud.reown.com/sign-up) : Sign up and create account on Reown (previously known  as WalletConnect). After account creation, create a new project, select `AppKit` as project type and select a frontend framework of your choice. After successful creation of a project, you will get a ProjectID, you will need this ProjectID while setting environment variables.
- [MetaMask](https://metamask.io/) : For interacting with the app.

### Installation and setup

1. **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/PolyPoll.git
    cd PolyPoll
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Smart contract deployment: Deploy `PollConductorV1.sol` smart contract using [Remix IDE](https://remix.ethereum.org/)**
  
    ```text
    Navigate to the smart contract in the contracts folder.
    Deploy this smart contract using the Remix IDE on the Polygon blockchain.
    ```

4. **Environment variables: Create `.env` file at root level of app**

    ```ini
    VITE_REOWN_POLYPOLL_PROJECT_ID = "" # Obtained Reown project ID.
    VITE_POLL_CONDUCTOR_V1_ADDRESS = "" # Deployed PollConductorV1.sol smart contract address.
    VITE_POLYPOLL_DOMAIN = "http://localhost:5173" # Local host to run locally.
    ```

5. **Run the app**

    ```bash
    npm run dev
    ```

##
