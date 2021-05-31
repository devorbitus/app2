var express = require('express');
var fs = require('fs');
var app = express();
var PORT = process.env.PORT || 3000;

app.get('/', function (req, res) {
    console.log('Hi!');
    res.status(200).send('Hello Database World!!!!');
});

app.get('/connect', async (req, res, next) => {
    try {
        let htmlData = fs.readFileSync("./index.html", "utf8");
        const vaultToken = fs.readFileSync('/opt/gcloud/v-token', 'utf-8');
        if (vaultToken) {
            const VaultSDK = require('node-vault')({ 
                apiVersion: 'v1', 
                endpoint: process.env.VAULT_ADDR || '', 
                token: vaultToken 
            });
            const creds = await VaultSDK.read('database/creds/readonly');
            const { Client: PostgresClient } = require('pg');
            const postgres_config = {
                host: process.env.DATABASE_HOST || 'localhost',
                port: Number(process.env.DATABASE_PORT) || 5432,
                user: creds.data.username,
                password: creds.data.password,
                database: 'postgres',
                ssl: {
                    rejectUnauthorized: false
                }
            };
            const postgres_client = new PostgresClient(postgres_config);
            postgres_client.connect();
            const rows = await postgres_client.query('SELECT * FROM companies');
            let html = createHtmlTable(rows.rows, ['id', 'name']);
            console.log('presenting table data');
            res.status(200).send(htmlData + `<br>` + html);
        } else {
            console.error('unable to find vault token');
            res.status(500).send(`Unable to find vault token`);
        }
    } catch (error) {
        console.log('Error', error, JSON.stringify(error, null, 2));
        next(new Error('Server Error : Admin to check logs', error));
    }
});

app.listen(PORT, function () {
    console.log('Server is running on PORT:', PORT);
});

// extracted from https://kb.objectrocket.com/postgresql/nodejs-express-postgresql-tutorial-part-2-961
// function that will return Postgres records as an HTML table
function createHtmlTable(tableRows, tableCol) {
    // open a <script> tag for the string
    let htmlData = "<script>var tableData = `<thead>\n<tr>";
    // use map() to iterate over the table column names
    tableCol.map(col => {
        col = col.toUpperCase();
        htmlData += `\n<th>${col}</th>`;
    });
    // open the head and body tags for the table
    htmlData += `\n</thead>\n<tbody>\n`;
    // iterate over the table row data with map()
    tableRows.map(row => {
        // open a new table row tag for each Postgres row
        htmlData += `\n<tr>`;
        // iterate over the row's data and enclose in <td> tag
        for (val in row) {
            htmlData += `\n<td>${row[val]}</td>`;
        }
        // close the table row <tr> tag
        htmlData += `\n</tr>`;
    });
    // close the table body and script tags
    htmlData += "\n</tbody>`;</script>";
    // return the string
    return htmlData;
}
