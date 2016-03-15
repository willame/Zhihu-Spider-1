var request = require('request');
var Promise = require('bluebird');
var config = require('./config');

var fetchFollwerOrFollwee = function(options) {
    var user = options.user;
    var isFollowees = options.isFollowees;
    var grounpAmount = isFollowees ? Math.ceil(user.followeeAmount / 20) : Math.ceil(user.followerAmount / 20);
    var offsets = [];
    for (var i = 0; i < grounpAmount; i++) {
        offsets.push(i * 20);
    }
    return Promise.map(offsets, function(offset) {
        return getFollwerOrFollwee(user, offset, isFollowees);
    }, { concurrency: 2 }).then(function(array){
        var result = [];
        array.forEach(function(item){
            result = result.concat(item);
        });
        return result;
    })
}

// fetchFollwerOrFollwee({
//     user: {
//         hash_id: 'f0d87e715ed801e0230976d7f26f5cc8',
//         name: 'Azure',
//         url: 'https://www.zhihu.com/people/azure-62',
//         followeeAmount: 847,
//         followerAmount: 53
//     },
//     isFollowees: true
// })

function getFollwerOrFollwee(user, offset, isFollowees) {
    console.log('开始抓取 ' + user.name + ' 的第 ' + offset + '-' + (offset + 20) + ' 位' + (isFollowees ? '关注的人' : '关注者'));
    var params = "{\"offset\":{{counter}},\"order_by\":\"created\",\"hash_id\":\"{{hash_id}}\"}".replace(/{{counter}}/, offset).replace(/{{hash_id}}/, user.hash_id);
    //console.log(params);
    return new Promise(function(resolve, reject) {
        request({
            method: 'POST',
            url: isFollowees ? 'https://www.zhihu.com/node/ProfileFolloweesListV2' : 'https://www.zhihu.com/node/ProfileFollowersListV2',
            form: {
                method: "next",
                params: params,
                _xsrf: "44f011b01f29816fc257fae1770a9ece"
            },
            headers: {
                'cookie': config.cookie,
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'cache-control': 'no-cache',
                'x-requested-with': 'XMLHttpRequest'
            }
        }, function(err, res, body) {
            var tmp = [];
            try {
                if (body) {
                    tmp = JSON.parse(body).msg.map(parseCard);
                } else {
                    throw ('Body is undefined');
                }
            } catch (e) {
                console.log("\n======ERROR======");
                console.log(e, body);
                console.log("======ERROR======\n");
            }
            if(err){
                reject(err)
            }else{
                resolve(tmp);
            }
        })
    })
}

function parseCard(text) {
    var result = {};
    var re1 = /data-id=\"(\S*)\"/g;
    var re2 = /<h2 class=\"zm-list-content-title\">.*>(.*)<\/a><\/h2>/g
    var re3 = /href=\"(https:\/\/www\.zhihu\.com\/people\/\S*)\"/g;
    re1.exec(text);
    result.hash_id = RegExp.$1;
    re2.exec(text);
    result.name = RegExp.$1;
    re3.exec(text);
    result.url = RegExp.$1;
    return result;
}

function consoleLog(x) {
    console.log(x);
    return x;
}



module.exports = fetchFollwerOrFollwee;