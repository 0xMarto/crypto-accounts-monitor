var accountFetchPeriod=5e3,priceFetchPeriod=2e4,btcDecimals=5,ethDecimals=5,accounts=[],currentAccountUpdated=0,accountsRefresh=!1,ethPrice=0,btcPrice=0;function Account(e,t,c,a){this.code=e,this.currency=t,this.address=c,this.label=a}function showAccountPanel(){$("#add-address-btn").hide(),$("#config-btn").hide(),$("#new-account-panel").fadeIn(),$("#acc-address").focus()}function showConfigPanel(){vex.dialog.alert({unsafeMessage:$("#config-container").html()})}function createAccountCard(e){0===accounts.length&&$("#account-container").empty();var t="",c="c2",a=accounts.length%8;if(1!==a&&3!==a&&4!==a&&6!==a||(c="c4"),t+='<div class="overview-item overview-item--'+c+'">',t+='<button type="button" class="remove-account-btn" aria-label="Close" onclick="removeAccount(\''+e.code+"');\">",t+='<span aria-hidden="true">&times;</span>',t+="</button>",t+='<div class="overview__inner">',t+='<div class="overview-box clearfix">',"BTC"===e.currency){t+='<img src="images/btc_outline.png" class="crypto-logo">',t+='<div class="text">',t+='<h2 class="balance tooltipster">-.-----</h2>',t+='<span class="balance-label">Bitcoins | </span>';var o="https://www.blockchain.com/btc/address/"+e.address}else if("MANA"===e.currency){t+='<img src="images/mana_token_grey.png" class="crypto-logo">',t+='<div class="text">',t+='<h2 class="balance tooltipster">-.-----</h2>',t+='<span class="balance-label">MANA | </span>';o="https://etherscan.io/tokenholdings?a="+e.address}else if("MKR"===e.currency){t+='<img src="images/mkr_token_grey.png" class="crypto-logo">',t+='<div class="text">',t+='<h2 class="balance tooltipster">-.-----</h2>',t+='<span class="balance-label">MKR | </span>';o="https://etherscan.io/tokenholdings?a="+e.address}else if("POLY"===e.currency){t+='<img src="images/poly_token_grey.png" class="crypto-logo">',t+='<div class="text">',t+='<h2 class="balance tooltipster">-.-----</h2>',t+='<span class="balance-label">POLY | </span>';o="https://etherscan.io/tokenholdings?a="+e.address}else{t+='<img src="images/eth_outline.png" class="crypto-logo">',t+='<div class="text">',t+='<h2 class="balance tooltipster">-.-----</h2>',t+='<span class="balance-label">Ethers | </span>';o="https://etherscan.io/address/"+e.address}t+='<b class="usd-balance">usd ---.--</b>',t+="</div>",t+="</div>";var n=e.address.substr(0,5),s=e.address.slice(-5);t+='<p class="added-address">',t+="<b>"+e.label+"</b> | ",t+='<span class="tooltipster" title="'+e.address+'">'+n+"..."+s+"</span>",t+='<a class="more-info-btn" target="_blank" href="'+o+'"> > </a>',t+="</p>",t+="</div>",t+="</div>";var r=document.createElement("div");r.id=e.code,r.className="col-sm-6 col-lg-3 account-card",r.innerHTML=t,$("#account-container").append(r),initTooltip($("#"+e.code).find(".added-address"))}function loadSavedAccountsFromCookie(){var e=Cookies.get("cam-info");if(e&&e.length>2){e=$.parseJSON(e),$("#account-container").empty();for(var t=0;t<e.length;t++)addAccount(e[t].currency,e[t].address,e[t].label);console.log("Accounts pre loaded: "+e.length)}else console.log("No accounts pre loaded")}function saveAccountsToCookie(){Cookies.set("cam-info",JSON.stringify(accounts),{expires:365})}function startAccountRefresh(){accountsRefresh=!0,refreshAccounts()}function refreshAccounts(){accountsRefresh&&setTimeout(updateAccounts,accountFetchPeriod)}function updateAccounts(){if(0===accounts.length)return console.log("No accounts added yet"),void refreshAccounts();currentAccountUpdated===accounts.length&&(currentAccountUpdated=0);try{var e=accounts[currentAccountUpdated];"BTC"===e.currency?requestBtcBalance(e):"ETH"===e.currency?requestEthBalance(e):requestEthTokenBalance(e)}catch(e){console.log("Some account was removed or some error found. Restarting."),currentAccountUpdated=0,refreshAccounts()}}function createAccount(){var e=$("#acc-currency").val(),t=$("#acc-address").val().trim();addAccount(e,t,$("#acc-label").val())?($("#acc-address").val(""),$("#acc-label").val(""),$("#new-account-panel").hide(),$("#add-address-btn").fadeIn(),$("#config-btn").fadeIn()):(alert("Verify address format for the currency selected"),""===t&&($("#new-account-panel").hide(),$("#add-address-btn").fadeIn(),$("#config-btn").fadeIn()))}function addAccount(e,t,c){if("BTC"!==e&&"ETH"!==e&&"MANA"!==e&&"MKR"!==e&&"POLY"!==e)return console.log("unsupported currency"),!1;var a=!1;"BTC"===e?a=new RegExp("^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$").test(t):a=new RegExp("^0x[a-fA-F0-9]{40}$").test(t);if(!a)return console.log("unsupported address for "+e),!1;var o=e+"-"+(accounts.length+1);c||(c=o);var n=new Account(o,e,t,c);return createAccountCard(n),accounts.push(n),console.log("new account added"),saveAccountsToCookie(),!0}function removeAccount(e){accounts=accounts.filter(function(t){return t.code!==e}),$("#"+e).fadeOut("normal",function(){$("#"+e).remove()}),saveAccountsToCookie()}function requestEthBalance(e){0===accounts.length&&(console.log("No accounts added yet"),refreshAccounts());var t="https://api.etherscan.io/api?module=account&action=balance&address="+e.address+"&tag=latest&apikeyHIVHFXVPC9CPKN1RFZ8PN8HAAMQHNBTCHA";$.ajax({type:"GET",url:t,data:{},contentType:"application/json; charset=utf-8",crossDomain:!0,dataType:"json",success:function(t,c,a){console.log("Eth data received: "+e.code);var o=ethFromWei(t.result),n=o>=1e3?o.toLocaleString():o,s=$("#"+e.code);s.find(".balance").text(n);var r=(new Date).toTimeString();if(s.find(".balance").hasClass("tooltipstered")?s.find(".balance").tooltipster("content",r):(s.find(".balance").prop("title",r),initTooltip(s.find(".balance").parent())),0!==ethPrice){var i=parseFloat((o*ethPrice).toFixed(2));i>99e6&&(i=Math.round(i)),s.find(".usd-balance").text("usd "+i.toLocaleString())}currentAccountUpdated+=1,refreshAccounts()},error:function(e,t){console.log("Eth fail: "+t.code),console.log(e),currentAccountUpdated+=1,refreshAccounts()}})}function requestEthTokenBalance(e){0===accounts.length&&(console.log("No accounts added yet"),refreshAccounts());var t="https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress="+("MANA"===e.currency?"0x0f5d2fb29fb7d3cfee444a200298f468908cc942":"MKR"===e.currency?"0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2":"0x9992ec3cf6a55b00978cddf2b27bc6882d88d1ec")+"&address="+e.address+"&tag=latest&apikeyHIVHFXVPC9CPKN1RFZ8PN8HAAMQHNBTCHA";$.ajax({type:"GET",url:t,data:{},contentType:"application/json; charset=utf-8",crossDomain:!0,dataType:"json",success:function(t,c,a){console.log("Token data received: "+e.code);var o=ethFromWei(t.result),n=o>=1e3?o.toLocaleString():o,s=$("#"+e.code);s.find(".balance").text(n);var r=(new Date).toTimeString();s.find(".balance").hasClass("tooltipstered")?s.find(".balance").tooltipster("content",r):(s.find(".balance").prop("title",r),initTooltip(s.find(".balance").parent())),s.find(".usd-balance").text("Token"),currentAccountUpdated+=1,refreshAccounts()},error:function(e,t){console.log("Eth fail: "+t.code),console.log(e),currentAccountUpdated+=1,refreshAccounts()}})}function requestBtcBalance(e){0===accounts.length&&(console.log("No accounts added yet"),refreshAccounts());var t="https://blockexplorer.com/api/addr/"+e.address+"/balance";$.ajax({type:"GET",url:t,data:{},contentType:"application/json; charset=utf-8",crossDomain:!0,dataType:"json",success:function(t,c,a){console.log("Btc data received: "+e.code);var o=btcFromSatoshi(t.toString()),n=o>=1e3?o.toLocaleString():o,s=$("#"+e.code);s.find(".balance").text(n);var r=(new Date).toTimeString();if(s.find(".balance").hasClass("tooltipstered")?s.find(".balance").tooltipster("content",r):(s.find(".balance").prop("title",r),initTooltip(s.find(".balance").parent())),0!==btcPrice){var i=parseFloat((o*btcPrice).toFixed(2));i>99e6&&(i=Math.round(i)),s.find(".usd-balance").text("usd "+i.toLocaleString())}currentAccountUpdated+=1,refreshAccounts()},error:function(e,t){console.log("BTC Update fail: "+t.code),console.log(e),currentAccountUpdated+=1,refreshAccounts()}})}function updateEthPrice(){$.ajax({type:"GET",url:"https://api.etherscan.io/api?module=stats&action=ethprice&apikeyHIVHFXVPC9CPKN1RFZ8PN8HAAMQHNBTCHA",data:{},contentType:"application/json; charset=utf-8",crossDomain:!0,dataType:"json",success:function(e,t,c){ethPrice=parseFloat(e.result.ethusd),ethBtcPrice=parseFloat(e.result.ethbtc);var a="BTC: usd "+(btcPrice=parseFloat((ethPrice/ethBtcPrice).toFixed(2))).toLocaleString()+" | ETH: usd "+ethPrice.toLocaleString();console.log("Price data received:"+a),$("#right-footer").find(".prices").text(a),$("#left-footer").find(".prices").text("Status: Connected"),setTimeout(updateEthPrice,priceFetchPeriod)},error:function(e,t){console.log("ETH Price fail"),console.log(e),$("#left-footer").find(".prices").text("Status: Disconnected"),setTimeout(updateEthPrice,priceFetchPeriod)}})}function ethFromWei(e){var t=parseInt(e)/1e18;return parseFloat(t.toFixed(ethDecimals))}function btcFromSatoshi(e){var t=parseInt(e)/1e8;return parseFloat(t.toFixed(btcDecimals))}function stopAccountRefresh(){accountsRefresh=!1}function initTooltip(e){e.find(".tooltipster").tooltipster({theme:"tooltipster-shadow",animation:"fade",delay:300,interactive:!0})}console.log("- All controller loaded -"),$(document).ready(function(){loadSavedAccountsFromCookie(),updateEthPrice(),startAccountRefresh()});