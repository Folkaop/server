const axios = require('axios');

const harperGetMessages = (room) => {
    const dbUrl = process.env.HARPERDB_URL;
    const dbPw = process.env.HARPERDB_PW;
    if (!dbUrl || !dbPw) return null;

    let data = JSON.stringify({
        operation: 'sql',
        sql: `SELECT * FROM realtime_chat_app.messages WHERE room = '${room}' LIMIT 100` // select top 100 msg
    })

    let config = {
        method: 'post',
        url: dbUrl,
        headers: {
            'Content-Type': 'application/json',
            Authorization: dbPw,
        },
        data: data,
    }

    return new Promise((resolve, reject) => {
        axios(config)
            .then(function (responce) {
                resolve(JSON.stringify(responce.data))
            })
            .catch(function (error){
            reject(error);
        });
    });
}

module.exports = harperGetMessages;