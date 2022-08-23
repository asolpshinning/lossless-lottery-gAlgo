import { loadStdlib } from "@reach-sh/stdlib";
import { ALGO_MyAlgoConnect as MyAlgoConnect } from "@reach-sh/stdlib";
import * as backendCtc from "../reachBackend/index.main.js";
let algoWalletConnected = false
let acc = null
export const contractId = '106242078'
export const tokenId = '106113272'

 //useful function to getELement by id
export const getElement = (id) => {
    let theElement = document.getElementById(id);
    return theElement.value
}

export const parseCurrency = (currency) => {
    const reach = loadStdlib({ REACH_CONNECTOR_MODE: "ALGO" });
    reach.setWalletFallback(
        reach.walletFallback({ providerEnv: "TestNet", MyAlgoConnect })
    );
    return reach.parseCurrency(currency)
}

export const formatCurrency = (currency) => {
    const reach = loadStdlib({ REACH_CONNECTOR_MODE: "ALGO" });
    reach.setWalletFallback(
        reach.walletFallback({ providerEnv: "TestNet", MyAlgoConnect })
    );
    return reach.formatCurrency(currency,6)
}

export const connectAlgoWallet = async () => {
  const reach = loadStdlib({ REACH_CONNECTOR_MODE: "ALGO" });
  reach.setWalletFallback(
      reach.walletFallback({ providerEnv: "TestNet", MyAlgoConnect })
  );
  if(algoWalletConnected == false) {
    acc = await reach.getDefaultAccount();  
  }    
  algoWalletConnected = true;
  
    const contractUserPubKey = acc.getAddress();
    const address = (reach.formatAddress(contractUserPubKey));
    return address;
  };

export const connectedCtc = async () => {
    const reach = loadStdlib({ REACH_CONNECTOR_MODE: "ALGO" });
    reach.setWalletFallback(
        reach.walletFallback({ providerEnv: "TestNet", MyAlgoConnect })
    );
    if(algoWalletConnected == false) {
        acc = await reach.getDefaultAccount();  
    }
    const ctc = acc.contract(backendCtc, contractId);
    return ctc;
}

export const getBalance = async () => {
    const reach = loadStdlib({ REACH_CONNECTOR_MODE: "ALGO" });
    reach.setWalletFallback(
        reach.walletFallback({ providerEnv: "TestNet", MyAlgoConnect })
    );
    if(algoWalletConnected == false) {
        acc = await reach.getDefaultAccount();  
    }
    let x = reach.formatCurrency((await reach.balanceOf(acc)), 2);
    return x;
}

export const checkAlgoNftBalance = async (nft) => {
    const reach = loadStdlib({ REACH_CONNECTOR_MODE: "ALGO" });
    reach.setWalletFallback(
        reach.walletFallback({ providerEnv: "TestNet", MyAlgoConnect })
    );
    if(algoWalletConnected == false) {
        acc = await reach.getDefaultAccount();  
    }
    let ret =  parseFloat(reach.formatCurrency(await reach.balanceOf(acc, nft), 6))*1000000;
    return ret;
}

export const tokenAccept = async () => {
  const reach = loadStdlib({ REACH_CONNECTOR_MODE: "ALGO" });
    reach.setWalletFallback(
        reach.walletFallback({ providerEnv: "TestNet", MyAlgoConnect })
    );
  if(algoWalletConnected == false){
    acc = await reach.getDefaultAccount();
  }
  await acc.tokenAccept(tokenId);
}

export const callAPI = async (
    reachBackend,
    ctcDeployed,
    apiName,
    apiArg
  ) => {
    let response;
    const reach = loadStdlib({ REACH_CONNECTOR_MODE: "ALGO" });
    reach.setWalletFallback(
        reach.walletFallback({ providerEnv: "TestNet", MyAlgoConnect })
    );
    if(algoWalletConnected == false){
      acc = await reach.getDefaultAccount();
    }
    const ctc = acc.contract(reachBackend, ctcDeployed);
  
    const call = async (f) => {
      console.log(acc)
      let res = undefined;
      try {
        res =  await f();
        response = await f();
        if (res == `no`) {
          console.log(`"${apiName}" API is not available from Reach backend`);
          alert(`"${apiName}" API is not available from Reach backend`);
        }
        else {
          console.log(
            `the "${apiName}" API has successfully worked. Here is the response:`,
            res
          );
          alert(
            `the "${apiName}" API has successfully worked. Here is the response: ${res}`
          );
        }
      } catch (e) {
        res = [`err`, e];
        console.log(`there is an error while running "${apiName} API: "`, e);
        alert(`there is an error while running "${apiName} API: ${e}`);
      }
    };
    //
  const apis = ctc.a;
  call(async () => {
    let apiReturn = ``;
    for (const x in apis) {
      if (x == apiName) {
        apiReturn = await apis[apiName](...apiArg);
      }
    }
    if (apiReturn == ``) {
      apiReturn = `no`;
    }
    return apiReturn;
  });
  return response;
}

export const runAPI = async (apiName, argumentArray = []) => {
    callAPI(backendCtc, contractId, apiName, argumentArray);
  };

//deploy contract
export const deployContract = async () => {
    const reach = loadStdlib({ REACH_CONNECTOR_MODE: "ALGO" });
    reach.setWalletFallback(
        reach.walletFallback({ providerEnv: "TestNet", MyAlgoConnect })
    );
    if(algoWalletConnected == false) {
        acc = await reach.getDefaultAccount();  
    }
    const ctcCreator = acc.contract(backendCtc);
    //launch gAlgo Token and launch contract
    reach.launchToken(acc, 'gALgo', 'gAlgo').then(
        (gAlgo) => {
            alert(`gAlgo token has been launched: ${gAlgo.id}`);
            backendCtc.Creator(ctcCreator, {
                getParams: () => {
                    console.log(`${reach.formatAddress(acc)} about to set five parameters of Contract`);
        
                    return {
                         gAlgo: tokenId,  //gAlgo.id,
                         Manager : acc,
                         minimumForTicket : reach.parseCurrency(10),
                         weeklyPercent : reach.parseCurrency(0.03/12),
                         gAlgoAdminSupply : reach.parseCurrency(100000),
                    }
                },
                iDeployed: async (msg) => {
                    console.log(msg);
                    let deployedCtc = await (ctcCreator.getInfo());
                    alert(`this is the contract ID: ${deployedCtc} and ${msg}`);
                },
            })        }
    )
}

export const vTotMinted = async () => {
  const reach = loadStdlib({ REACH_CONNECTOR_MODE: "ALGO" });
  reach.setWalletFallback(
      reach.walletFallback({ providerEnv: "TestNet", MyAlgoConnect })
  );
  if(algoWalletConnected == false) {
      acc = await reach.getDefaultAccount();  
  }
  const ctc = acc.contract(backendCtc);
  let res =  await ctc.views.totalMinted_v();
  console.log(res[1]);
    return formatCurrency(res[1],0);
}

export const vTotTickets = async () => {
    const reach = loadStdlib({ REACH_CONNECTOR_MODE: "ALGO" });
    reach.setWalletFallback(
        reach.walletFallback({ providerEnv: "TestNet", MyAlgoConnect })
    );
    console.log(`wallet fall back worked`)
    if(algoWalletConnected == false) {
        acc = await reach.getDefaultAccount();
        console.log(`wallet was not connected b4 now connected`)  
    }
    const ctc = acc.contract(backendCtc);
    console.log(`now acc to ctc`)
    let v =  ctc.views
    let c = await v.Creator_v();
    console.log(c);
    let res =  c[1];
    console.log(res);
      //return formatCurrency(res[1],0);
  }

  //write a function that takes in an argument to check if type of argument is a Promise
  //if it is a Promise, then return the result of the Promise
  //if it is not a Promise, then return the argument
  export const checkPromise = async (arg) => {
    if (arg instanceof Promise) {
      return await arg;
    } else {
      return arg;
    }
  }
