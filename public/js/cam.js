// Main Parameters
var accountFetchPeriod = 5000;
var priceFetchPeriod = 20000;
var btcDecimals = 5;
var ethDecimals = 5;

// Main Variables and data model
var accounts = [];
var currentAccountUpdated = 0;
var accountsRefresh = false;
var ethPrice = 0;
var btcPrice = 0;

function Account(code, currency, address, label) {
    this.code = code;
    this.currency = currency;
    this.address = address;
    this.label = label;
}


// GUI funtions
function showAccountPanel() {
    $('#add-address-btn').hide();
    $('#new-account-panel').fadeIn();
    $('#acc-address').focus();
}

function createAccountCard(account) {
    if (accounts.length === 0) {
        $('#account-container').empty();
    }

    var accountHTML = '';
    var card_code = 'c2';
    var rest = accounts.length % 8;
    if (rest === 1 || rest === 3 || rest === 4 || rest === 6) {
        card_code = 'c4';
    }
    accountHTML += '<div class="overview-item overview-item--' + card_code + '">';
    accountHTML += '<button type="button" class="remove-account-btn" aria-label="Close" ' +
        'onclick="removeAccount(\'' + account.code + '\');">';
    accountHTML += '<span aria-hidden="true">&times;</span>';
    accountHTML += '</button>';
    accountHTML += '<div class="overview__inner">';
    accountHTML += '<div class="overview-box clearfix">';
    if (account.currency === 'BTC') {
        accountHTML += '<img src="images/btc_outline.png" class="crypto-logo">';
        accountHTML += '<div class="text">';
        accountHTML += '<h2 class="balance tooltipster">-.-----</h2>';
        accountHTML += '<span class="balance-label">Bitcoins | </span>';
        var infoUrl = 'https://www.blockchain.com/btc/address/' + account.address;
    } else {
        accountHTML += '<img src="images/eth_outline.png" class="crypto-logo">';
        accountHTML += '<div class="text">';
        accountHTML += '<h2 class="balance tooltipster">-.-----</h2>';
        accountHTML += '<span class="balance-label">Ethers | </span>';
        var infoUrl = 'https://etherscan.io/address/' + account.address;
    }
    accountHTML += '<b class="usd-balance">usd ---.--</b>';
    accountHTML += '</div>';
    accountHTML += '</div>';
    var pre = account.address.substr(0, 5);
    var pos = account.address.slice(-5);
    accountHTML += '<p class="added-address">';
    accountHTML += '<b>' + account.label + '</b> | ';
    accountHTML += '<span class="tooltipster" title="' + account.address + '">' + pre + '...' + pos + '</span>';
    accountHTML += '<a class="more-info-btn" target="_blank" href="' + infoUrl + '"> > </a>';
    accountHTML += '</p>';
    accountHTML += '</div>';
    accountHTML += '</div>';

    var newNode = document.createElement("div");
    newNode.id = account.code;
    newNode.className = 'col-sm-6 col-lg-3 account-card';
    newNode.innerHTML = accountHTML;
    $('#account-container').append(newNode);

    //Init card tooltip
    var selector = $('#' + account.code).find('.added-address');
    initTooltip(selector);
}


// Cookie management funtions
function loadSavedAccountsFromCookie() {
    var savedAccounts = Cookies.get("cam-info");
    if (savedAccounts && savedAccounts.length > 2) {
        savedAccounts = $.parseJSON(savedAccounts);
        $('#account-container').empty();
        for (var i = 0; i < savedAccounts.length; i++) {
            addAccount(savedAccounts[i].currency, savedAccounts[i].address, savedAccounts[i].label);
        }
        console.log('Accounts pre loaded: ' + savedAccounts.length);
    } else {
        console.log('No accounts pre loaded');
    }
}

function saveAccountsToCookie() {
    Cookies.set("cam-info", JSON.stringify(accounts), {expires: 365});
}


// Main flow control functions
function startAccountRefresh() {
    accountsRefresh = true;
    refreshAccounts();
}

function refreshAccounts() {
    if (accountsRefresh) {
        setTimeout(updateAccounts, accountFetchPeriod);
    }
}

function updateAccounts() {
    if (accounts.length === 0) {
        console.log('No accounts added yet');
        refreshAccounts();
        return;
    }

    // Reset account counter if reach the last account
    if (currentAccountUpdated === accounts.length) {
        currentAccountUpdated = 0;
    }

    // Send account update request
    try {
        var account = accounts[currentAccountUpdated];
        if (account.currency === 'BTC') {
            requestBtcBalance(account);
        } else {
            requestEthBalance(account);
        }
    } catch (e) {
        console.log('Some account was removed or some error found. Restarting.');
        currentAccountUpdated = 0;
        refreshAccounts();
    }
}

function createAccount() {
    // Get form data
    var currency = $('#acc-currency').val();
    var address = $('#acc-address').val().trim();
    var label = $('#acc-label').val();

    // Try to add the new account
    var result = addAccount(currency, address, label);

    if (result) {
        $('#acc-address').val('');
        $('#acc-label').val('');
        $('#new-account-panel').hide();
        $('#add-address-btn').fadeIn();
    } else {
        alert('Verify address format for the currency selected');
        if (address === '') {
            $('#new-account-panel').hide();
            $('#add-address-btn').fadeIn();
        }
    }
}

function addAccount(currency, address, label) {
    // Validate inputs
    if (currency !== 'BTC' && currency !== 'ETH') {
        console.log('unsupported currency');
        return false;
    }

    var validAddress = false;
    if (currency === 'BTC') {
        var btcAddressFormat = new RegExp("^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$");
        validAddress = btcAddressFormat.test(address);
    } else {
        var ethAddressFormat = new RegExp("^0x[a-fA-F0-9]{40}$");
        validAddress = ethAddressFormat.test(address);
    }

    if (!validAddress) {
        console.log('unsupported address for ' + currency);
        return false;
    }

    var accountCode = currency + '-' + (accounts.length + 1);

    if (!label) {
        label = accountCode;
    }

    // Create and render new account
    var newAccount = new Account(accountCode, currency, address, label);
    createAccountCard(newAccount);
    accounts.push(newAccount);
    console.log('new account added');

    saveAccountsToCookie();
    return true;
}

function removeAccount(code) {
    var notCurrentAccount = function (account) {
        return account.code !== code;
    };
    accounts = accounts.filter(notCurrentAccount);
    $('#' + code).fadeOut('normal', function () {
        $('#' + code).remove();
    });
    saveAccountsToCookie();
}

// Fetch data functions
function requestEthBalance(account) {
    if (accounts.length === 0) {
        console.log('No accounts added yet');
        refreshAccounts();
    }

    var etherScanApiKey = "HIVHFXVPC9CPKN1RFZ8PN8HAAMQHNBTCHA";
    var module = 'account';
    var action = 'balance';
    var tag = 'latest';
    var address = account.address;

    var etherScanUrl = "https://api.etherscan.io/api" +
        '?module=' + module + '&action=' + action + '&address=' + address +
        '&tag=' + tag + '&apikey' + etherScanApiKey;

    $.ajax({
        type: "GET",
        url: etherScanUrl,
        data: {},
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        dataType: "json",
        success: function (data, status, jqXHR) {
            console.log('Eth data received: ' + account.code);

            // Populate account with balance received
            var balance = ethFromWei(data['result']);
            var balanceText = balance >= 1000 ? balance.toLocaleString() : balance;
            var accountCard = $('#' + account.code);
            accountCard.find('.balance').text(balanceText);

            // Init or update tooltip
            var title = (new Date).toTimeString();
            if (accountCard.find('.balance').hasClass('tooltipstered')) {
                accountCard.find('.balance').tooltipster('content', title);
            } else {
                accountCard.find('.balance').prop('title', title);
                initTooltip(accountCard.find('.balance').parent());
            }

            // Show price in USD
            if (ethPrice !== 0) {
                var usdBalance = parseFloat((balance * ethPrice).toFixed(2));
                if (usdBalance > 99000000) {
                    usdBalance = Math.round(usdBalance);
                }
                accountCard.find('.usd-balance').text('usd ' + usdBalance.toLocaleString());
            }

            // Send call to update next account
            currentAccountUpdated += 1;
            refreshAccounts();
        },
        error: function (jqXHR, status) {
            // error handler
            console.log('Eth fail: ' + status.code);
            console.log(jqXHR);

            // Send call to update next account
            currentAccountUpdated += 1;
            refreshAccounts();
        }
    });
}

function requestBtcBalance(account) {
    if (accounts.length === 0) {
        console.log('No accounts added yet');
        refreshAccounts();
    }

    var address = account.address;

    var blockexplorerUrl = "https://blockexplorer.com/api/addr/" + address + '/balance';

    $.ajax({
        type: "GET",
        url: blockexplorerUrl,
        data: {},
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        dataType: "json",
        success: function (data, status, jqXHR) {
            console.log('Btc data received: ' + account.code);

            // Populate account with balance received
            var balance = btcFromSatoshi(data.toString());
            var balanceText = balance >= 1000 ? balance.toLocaleString() : balance;
            var accountCard = $('#' + account.code);
            accountCard.find('.balance').text(balanceText);

            // Init or update tooltip
            var title = (new Date).toTimeString();
            if (accountCard.find('.balance').hasClass('tooltipstered')) {
                accountCard.find('.balance').tooltipster('content', title);
            } else {
                accountCard.find('.balance').prop('title', title);
                initTooltip(accountCard.find('.balance').parent());
            }

            if (btcPrice !== 0) {
                var usdBalance = parseFloat((balance * btcPrice).toFixed(2));
                if (usdBalance > 99000000) {
                    usdBalance = Math.round(usdBalance);
                }
                accountCard.find('.usd-balance').text('usd ' + usdBalance.toLocaleString());
            }

            // Send call to update next account
            currentAccountUpdated += 1;
            refreshAccounts();
        },
        error: function (jqXHR, status) {
            // error handler
            console.log('BTC Update fail: ' + status.code);
            console.log(jqXHR);

            // Send call to update next account
            currentAccountUpdated += 1;
            refreshAccounts();
        }
    });
}

function updateEthPrice() {
    var etherScanApiKey = "HIVHFXVPC9CPKN1RFZ8PN8HAAMQHNBTCHA";
    var module = 'stats';
    var action = 'ethprice';

    var etherScanUrl = "https://api.etherscan.io/api" +
        '?module=' + module + '&action=' + action + '&apikey' + etherScanApiKey;

    $.ajax({
        type: "GET",
        url: etherScanUrl,
        data: {},
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        dataType: "json",
        success: function (data, status, jqXHR) {
            ethPrice = parseFloat(data['result']['ethusd']);
            ethBtcPrice = parseFloat(data['result']['ethbtc']);
            btcPrice = parseFloat((ethPrice / ethBtcPrice).toFixed(2));
            var prices = 'BTC: usd ' + btcPrice.toLocaleString() + ' | ETH: usd ' + ethPrice.toLocaleString();
            console.log('Price data received:' + prices);
            $('#right-footer').find('.prices').text(prices);
            $('#left-footer').find('.prices').text('Status: Connected');
            setTimeout(updateEthPrice, priceFetchPeriod);
        },
        error: function (jqXHR, status) {
            // error handler
            console.log('ETH Price fail');
            console.log(jqXHR);
            $('#left-footer').find('.prices').text('Status: Disconnected');
            setTimeout(updateEthPrice, priceFetchPeriod);
        }
    });
}


// Utility functions
function ethFromWei(value) {
    var ethValue = parseInt(value) / 1000000000000000000;
    return parseFloat(ethValue.toFixed(ethDecimals));
}

function btcFromSatoshi(value) {
    var btcValue = parseInt(value) / 100000000;
    return parseFloat(btcValue.toFixed(btcDecimals));
}

function stopAccountRefresh() {
    accountsRefresh = false;
}

function initTooltip(jquery_selector) {
    jquery_selector.find('.tooltipster').tooltipster({
        // theme: 'tooltipster-borderless',
        theme: 'tooltipster-shadow',
        animation: 'fade',
        delay: 300,
        interactive: true
    });
}

console.log('- All controller loaded -');
$(document).ready(function () {
    loadSavedAccountsFromCookie();
    updateEthPrice();
    startAccountRefresh();
});

