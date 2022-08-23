import { useState, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import 'bulma/css/bulma.css';
import { 
  connectAlgoWallet,
  deployContract, 
  runAPI, 
  getBalance, 
  getElement,
  parseCurrency,
  connectedCtc,
  contractId,
  formatCurrency,
  tokenAccept,
  vTotMinted, 
  vTotTickets,
  reach, 
} from '../utils/contractFunctions';


export default function Home() {
  

  const [address, setAddress] = useState("Connect Your Wallet. Click 'connect'");
  const [balance, setBalance] = useState(0);
  const [totMinted, setTotMinted] = useState(0);
  const [totTickets, setTotTickets] = useState(0);
  const [startTick, setStartTick] = useState(0);
  const [endTick, setEndTick] = useState(0);
  const [winningTickets, setWinningTickets] = useState(['not yet determined']);
  const [rewardsClaimed, setRewardsClaimed] = useState(['not yet available']);
  const [commitSt, setCommitSt] = useState('n/a');


  const lotteryPlayers = [`0xskfnewjuewnuer`, `0xwieinfi3eekew`, `0xwieinfi3eekew`, `0xefniniewqweiri`]
  const lotteryHistory = [{id: 1, address: `0xdkfeinfiefine`}, {id: 2, address: `0xskfnewjuewnuer`}, {id: 3, address: `0xskfnewjuewnuer`}, {id: 4, address: `0xskfnewjuewnuer`}]

  const refreshStates = async () => {
    const ctc = await connectedCtc();
    let address = await connectAlgoWallet();
    setAddress(address);
    setBalance(await getBalance());
    let totMinted =  await ctc.views.totalMinted_v();
    console.log(formatCurrency(totMinted[1]));
    let totTickets = await ctc.views.totalTickets_v();
    setTotTickets(formatCurrency(totTickets[1]));
    let cs = await ctc.views.commitPeriodStarted_v();
    setCommitSt(cs[1]);
    console.log(`this is cs:`, cs[1]);
    setTotMinted(formatCurrency(totMinted[1]));
    let start = await ctc.views.ticketNumStart_v(address);
    setStartTick(formatCurrency(start[1]));
    let end = await ctc.views.ticketNumEnd_v(address);
    setEndTick(formatCurrency(end[1]));
    const winningTickets = async(x) => {
      let v = (await ctc.views.winningTicket_v(x));
      return formatCurrency(v[1]);
    };
    const getRewards = async(x) => {
      let ret = await ctc.views.rewardsClaimed_v(x);
      return ret[1]
    };
    //let x = (await ctc.views.winningTicket_v(1))
    console.log((await winningTickets(1)))
    let arr = [0,0,0,0,0,0,0,0,0,0,0,0]
    let wt = arr.map(async(n,i) => {
      let ret;
      if(await winningTickets(i+1) == 0) {ret = 'n/a'}
      else {ret = await winningTickets(i+1)}
      return ret
    })
    let rw = arr.map(async(n,i) => {
      let ret;
      if(await winningTickets(i+1) == 0) {ret = 'n/a'}
      else {ret = await getRewards(i+1)}
      return ret
    })
    await Promise.all(wt).then(res => wt = res);
    await Promise.all(rw).then(res => {rw = res;  setRewardsClaimed(rw); console.log(rw);});
    setWinningTickets(wt);
    
  }
  /* useEffect(() => {
    refreshStates();
  } ,[]) */


  return (
    <div>
      <Head>
        <title>Lossless Lottery</title>
        <meta name="description" content="An Ethereum Lottery dApp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <nav className="navbar mt-4 mb-4">
          <div className="container">
            <div className="navbar-brand">
              <h1>Lossless Lottery</h1>
            </div>
            <div className="navbar-end">
              <button onClick={async()=>{
                refreshStates()
              }} 
                className="button is-link">Connect/Refresh</button><br/>
                <button onClick = {deployContract} className="button " >Deploy Contract</button>

            </div>
          </div>
        </nav>
        <div className="container">
          <section className="mt-5">
            <div className="columns">
              <div className="column is-two-thirds">
                <b>Address: </b> {address} <br/>
                <b>Balance: </b> {balance} Algo <br/><br/>
                <section className="mt-5">
                  <p><b>Mint gAlgo: </b> Pay 1 Algo to Mint 1 gAlgo</p><br/>
                  amount: <input id = 'mint'></input><br/>
                  <button 
                    onClick={()=>{
                      tokenAccept();
                      runAPI('mintgAlgo', [parseCurrency(parseInt(getElement('mint')))])
                      .then(()=>refreshStates())
                    }} 
                    className="button is-link is-large is-light mt-3">
                      Mint
                  </button>
                </section>
                <section className="mt-6">
                  <p><b>Admin only:</b> Start Commitment Period</p>
                  <button 
                    onClick={()=>{
                      runAPI('startCommitmentPeriod').then(()=>refreshStates())
                    }} 
                    className="button is-success is-large is-light mt-3">
                      Start
                  </button>
                </section>
                <section className="mt-5">
                  <p><b>Get Lottery Tickets: </b> You get 1 ticket per gAlgo minted. Do not get tickets if you are not done minting</p>
                  <button 
                    onClick={()=>{
                      runAPI('getTickets').then(()=>refreshStates())
                      
                    }} 
                    className="button is-link is-large is-light mt-3">
                      Get
                  </button>
                </section>
                <section className="mt-6">
                  <p><b>Admin only:</b> Choose Winning Ticket for Current Week</p><br/>
                  random number: <input id = 'random'></input><br/>
                  <button 
                    onClick={()=>{
                      runAPI('getRandomWinner', [parseCurrency(parseInt(getElement('random')))])
                      .then(()=>refreshStates())
                    }} 
                    className="button is-primary is-large is-light mt-3">
                      Choose
                  </button>
                </section>
                <section className="mt-5">
                  <p><b>Claim Weekly Rewards: </b>Make sure the winning ticket is one of your tickets</p><br/>
                  <input id = 'rewards'></input><br/>
                  <button 
                    onClick={()=>{
                      runAPI('claimRewards',[parseInt(getElement('rewards'))]).then(()=>refreshStates())
                    }} 
                    className="button is-link is-large is-light mt-3">
                      Claim
                  </button>
                </section>
              </div>
              <div className={`${styles.lotteryinfo} column is-one-third`}>
              <section className="mt-5">
                  <div className="card">
                    <div className="card-content">
                      <div className="content">
                        <h2>Commitment Started: </h2>
                        <p><b>{`${commitSt}`}</b></p>
                      </div>
                    </div>
                  </div>
                </section>
              <section className="mt-5">
                  <div className="card">
                    <div className="card-content">
                      <div className="content">
                        <h2>My Tickets</h2>
                        <p>Starts at: <b>{startTick}</b></p>
                        <p>Ends at: <b>{endTick}</b></p>
                      </div>
                    </div>
                  </div>
                </section>
                <section className="mt-5">
                  <div className="card">
                    <div className="card-content">
                      <div className="content">
                        <h2>Lottery History</h2>
                        {
                          (winningTickets.length == 12) && winningTickets.map((item, i) => {
                            if (true) {
                              return <div className="history-entry mt-3" key={item+i}>
                                <div><b>Week #{i+1}</b> winning ticket: <b>{item}</b></div>
                                <div>
                                    Rewards Claimed: <b>{`${rewardsClaimed[i]}`}</b>
                                </div><br/>
                              </div>
                            }
                          })
                        }
                      </div>
                    </div>
                  </div>
                </section>
                <section className="mt-5">
                  <div className="card">
                    <div className="card-content">
                      <div className="content">
                        <h2>Total Tickets</h2>
                        <p>{totTickets} Tickets Sold</p>
                      </div>
                    </div>
                  </div>
                </section>
                <section className="mt-5">
                  <div className="card">
                    <div className="card-content">
                      <div className="content">
                        <h2>Total gAlgo Minted</h2>
                        <p>{totMinted} gAlgo</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2022 @asolpshinning</p>
      </footer>
    </div>
  )
}