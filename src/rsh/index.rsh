
    'reach 0.1';

    const Params = Object({
        gAlgo : Token,	
        Manager : Address,
	    minimumForTicket : UInt,
	    weeklyPercent : UInt,
        gAlgoAdminSupply : UInt,
    });
    export const main = Reach.App(() => {
        setOptions({ untrustworthyMaps: true });
        const Creator = Participant('Creator', {
            getParams: Fun([Bytes(15)], Params),
            iDeployed: Fun([Bytes(15)], Null),
        })
        const User = API({
            mintgAlgo : Fun([UInt], Bool),
	        getTickets : Fun([], Bool),
	        getRandomWinner : Fun([UInt], Bool),
	        claimRewards : Fun([UInt], Bool),
	        startCommitmentPeriod : Fun([], Bool),	
        });
        const Views = View({
            Creator_v : Address,
            Manager_v : Address,
            balance_v : UInt,
            balance_gAlgo_v : UInt,
            commitPeriodStarted_v : Bool,
            totalMinted_v : UInt,
            totalTickets_v : UInt,
            currentPrice_v : UInt,
            rewardsClaimed_v : Fun([UInt], Bool),
            ticketNumStart_v : Fun([Address], UInt),
            ticketNumEnd_v : Fun([Address], UInt),
            mintedAmount_v : Fun([Address], UInt),
            receivedTickets_v : Fun([Address], Bool),
            winningTicket_v : Fun([UInt], UInt),	
        });

        init();

        Creator.only(() => {
            const { Manager,minimumForTicket,weeklyPercent,gAlgo, gAlgoAdminSupply } = declassify(interact.getParams('I have deployed'));
            
        });

        Creator.publish(Manager,minimumForTicket,weeklyPercent,gAlgo, gAlgoAdminSupply);

        Creator.interact.iDeployed('I HAVE DEPLOYED');
        commit()
        Creator.pay([0,[gAlgoAdminSupply, gAlgo]]);
        const end = UInt.max;

        //unwrap integer map handler
        const unwInt = (m) => fromSome(m, UInt256(0));
        const unwInt64 = (m) => fromSome(m, 0);
        //unwarap array of 100 UInt
        const unwUintArrMap = (m) => fromSome(m, Array.replicate(12, 0));
        //unwrap boolean map handler
        const unwBool = (m) => fromSome(m, false);

        //arrays
        const winningTicketNumbers = Array.replicate(12, 0);
        const weeklyRewardClaimed = Array.replicate(12, false);

        //Maps
        const ticketNumStart = new Map(UInt);
        const ticketNumEnd = new Map(UInt);
        const mintedAmount = new Map(UInt);
	    const receivedTickets = new Map(Bool);

        //PR
        const [
            Manager_St,
            commitPeriodStarted_St,
            totalMinted_St,
            totalTickets_St,
            currentPrice_St,
            week_St,
            rewardsClaimed_St,
            winningTicket_St,
        ] = parallelReduce([Manager,false,0,0,0,0,weeklyRewardClaimed,winningTicketNumbers])
        .invariant(balance() >= 0)
        .while(true)
        .paySpec([gAlgo])
        .define(() => {
            Views.Creator_v.set(Creator);
            Views.Manager_v.set(Manager_St);
            Views.balance_v.set(balance());
            Views.balance_gAlgo_v.set(balance(gAlgo));
            Views.commitPeriodStarted_v.set(commitPeriodStarted_St);
            Views.totalMinted_v.set(totalMinted_St);
            Views.totalTickets_v.set(totalTickets_St);
            Views.currentPrice_v.set(currentPrice_St);
            Views.rewardsClaimed_v.set((week) => {
                check(week > 0 && week <= 12, 'Please enter a valid week number'); 
                return rewardsClaimed_St[week-1]
            });
            Views.ticketNumStart_v.set((addr) => unwInt64(ticketNumStart[addr]));
            Views.ticketNumEnd_v.set((addr) => unwInt64(ticketNumEnd[addr]));
            Views.mintedAmount_v.set((addr) => unwInt64(mintedAmount[addr]));
            Views.receivedTickets_v.set((addr) => unwBool(receivedTickets[addr]));
            Views.winningTicket_v.set((week) => { 
                check(week > 0 && week <= 12, 'Please enter a valid week number'); 
                return winningTicket_St[week-1]
            });
        })
        
        .api(
            User.mintgAlgo,
            // Assumes
            ((qty) => {
                assume(qty > 0,'Mint at least 1 gAlgo'); 
 		        assume(balance(gAlgo) >= qty,'Weirdly insufficient balance of gAlgo. Please contact Admin');
                assume(commitPeriodStarted_St == false,'Commitment period has already started. You can no longer mint gAlgo');
            }),
            // Payments
            ((qty) => [qty, [0, gAlgo]]),
            // Consensus
            ((qty, res) => {
                require(qty > 0,'Mint at least 1 gAlgo'); 
 		        require(balance(gAlgo) >= qty,'Weirdly insufficient balance of gAlgo. Please contact Admin');
                require(commitPeriodStarted_St == false,'Commitment period has already started. You can no longer mint gAlgo');
                //transfer
                transfer(qty,gAlgo ).to(this);
                //update variables
                const x = unwInt64(mintedAmount[this]) + qty;
		        mintedAmount[this] = x;
                res(true);
                return [
                    Manager_St,
                    commitPeriodStarted_St,
                    totalMinted_St + qty,
                    totalTickets_St,
                    currentPrice_St,
                    week_St,
                    rewardsClaimed_St,
                    winningTicket_St
                ];
            })
        )
        .api(
            User.getTickets,
            // Assumes
            (() => {
                assume(unwInt64(mintedAmount[this]) > minimumForTicket,'You do not have the required minimum to receive lottery tickets'); 
 		        assume(unwBool(receivedTickets[this]) == false,'You have already received your tickets for the lottery');
            }),
            // Payments
            (() => [0, [0, gAlgo]]),
            // Consensus
            ((res) => {
                require(unwInt64(mintedAmount[this]) > minimumForTicket,'You do not have the required minimum to receive lottery tickets'); 
 		        require(unwBool(receivedTickets[this]) == false,'You have already received your tickets for the lottery');
                
                ticketNumStart[this] = totalTickets_St  +  1000000 ;
		        ticketNumEnd[this] = unwInt64(mintedAmount[this]) +  totalTickets_St  ;
		        const totalTickets_Stt = unwInt64(mintedAmount[this]) +  totalTickets_St ;
		        receivedTickets[this] = true;
                res(true);
                return [
                    Manager_St,
                    commitPeriodStarted_St,
                    totalMinted_St,
                    totalTickets_Stt,
                    currentPrice_St,
                    week_St,
                    rewardsClaimed_St,
                    winningTicket_St
                ];
            })
        )
        .api(
            User.getRandomWinner,
            // Assumes
            ((randomNum) => {
                assume(week_St >= 0 && week_St < 12,'Week must be between 1 and 11');
                assume(Manager_St == this || Creator == this,'Only Creator or Manager can use this API'); 
 		        assume(totalTickets_St < randomNum,'You must enter a value greater than total lottery tickets');
            }),
            // Payments
            ((_) => [0, [0, gAlgo]]),
            // Consensus
            ((randomNum, res) => {
                require(week_St >= 0 && week_St < 12,'Week must be between 1 and 11');
                require(Manager_St == this || Creator == this,'Only Creator or Manager can use this API'); 
 		        require(totalTickets_St < randomNum,'You must enter a value greater than total lottery tickets');
                const wt = (randomNum  %  totalTickets_St)  +  1000000 ;
                const winningTicket_Stt = winningTicket_St.set(week_St, wt) // set array winningTicket_St at index week_St to wt
                const week_Stt = week_St + 1 ;
                res(true);
                return [
                    Manager_St,
                    commitPeriodStarted_St,
                    totalMinted_St,
                    totalTickets_St,
                    currentPrice_St,
                    week_Stt,
                    rewardsClaimed_St,
                    winningTicket_Stt
                ];
            })
        )
        .api(
            User.claimRewards,
            // Assumes
            ((week) => {
                assume(week > 0 && week <= 12,'You must enter a valid week');
                assume(winningTicket_St[week-1] > 0, 'The winning ticket for this week has not been determined yet');
                assume(unwInt64(ticketNumStart[this]) <= winningTicket_St[week-1] && unwInt64(ticketNumEnd[this]) >= winningTicket_St[week-1],'You do not have the winning ticket for the week you are trying to claim'); 
 		        assume(rewardsClaimed_St[week-1] == false,'Reward lottery for the week entered has already been claimed'); 
		        assume(balance(gAlgo) >= totalMinted_St*weeklyPercent,'Weirdly not enough balance. Please contact Admin');
            }),
            // Payments
            ((_) => [0, [0, gAlgo]]),
            // Consensus
            ((week, res) => {
                require(week > 0 && week <= 12,'You must enter a valid week');
                require(winningTicket_St[week-1] > 0, 'The winning ticket for this week has not been determined yet');
                require(unwInt64(ticketNumStart[this]) <= winningTicket_St[week-1] && unwInt64(ticketNumEnd[this]) >= winningTicket_St[week-1],'You do not have the winning ticket for the week you are trying to claim'); 
 		        require(rewardsClaimed_St[week-1] == false,'Reward lottery for the week entered has already been claimed'); 
		        require(balance(gAlgo) >= totalMinted_St*weeklyPercent,'Weirdly not enough balance. Please contact Admin');
                transfer(weeklyPercent * totalMinted_St,gAlgo ).to(this);
                //update variables
                const rewardsClaimed_Stt = rewardsClaimed_St.set(week - 1, true) // set array rewardsClaimed_St at index )week-1) to true

                res(true);
                return [
                    Manager_St,
                    commitPeriodStarted_St,
                    totalMinted_St,
                    totalTickets_St,
                    currentPrice_St,
                    week_St,
                    rewardsClaimed_Stt,
                    winningTicket_St
                ];
            })   
        ).api(
            User.startCommitmentPeriod,
            // Assumes
            (() => {
                assume(Manager_St == this,'Only Creator or Manager can start commitment period'); 
            }),
            // Payments
            (() => [0, [0, gAlgo]]),
            // Consensus
            ((res) => {
                require(Manager_St == this,'Only Creator or Manager can start commitment period'); 
                
                const commitPeriodStarted_Stt = true;

                res(true);
                return [
                    Manager_St,
                    commitPeriodStarted_Stt,
                    totalMinted_St,
                    totalTickets_St,
                    currentPrice_St,
                    week_St,
                    rewardsClaimed_St,
                    winningTicket_St
                ];
            })
        )
        .timeout(absoluteTime(end), () => {
            Anybody.publish();
            return [
                Manager_St,
                commitPeriodStarted_St,
                totalMinted_St,
                totalTickets_St,
                currentPrice_St,
                week_St,
                rewardsClaimed_St,
                winningTicket_St
            ];
        })
        commit();
        exit();
    });   
    