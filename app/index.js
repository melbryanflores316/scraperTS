const puppeteer = require('puppeteer');
const { BlobServiceClient } = require("@azure/storage-blob");
const connStr = "DefaultEndpointsProtocol=https;AccountName=testpupscrape;AccountKey=VcRnt1q2PfYKzExpO50eLQagumJfsH7riYKYMBvXeD8nIl1zoETQH2dSwkx++4yczIoG/Wws3JsdLh/DNT8NLA==;EndpointSuffix=core.windows.net";
const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
const app = require('express')();
async function upload(fileName, data) {
    const containerClient = blobServiceClient.getContainerClient('test');
    // Create a unique name for the blob
    const blobName = fileName;

// Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    console.log('\nUploading to Azure storage as blob:\n\t', blobName);

// Upload data to the blob
    const uploadBlobResponse = await blockBlobClient.upload(data, data.length);
    console.log("Blob was uploaded successfully. requestId: ", uploadBlobResponse.requestId);
}

// const run = (async () => {
//     const browser = await puppeteer.launch({ headless: false });
//     const pageNew = await browser.newPage()
//     await pageNew.setViewport({ width: 1280, height: 800 });
//     await pageNew.goto(appSettings.url);
//     // login
//     let username = await pageNew.waitForXPath("//*[@id=\"signInName\"]",{ visible: true });
//     if (username === null)
//     {
//         console.log('username field');
//     }
//     else{
//         await username.type(appSettings.username);
//         console.log('username');
//     }
//     let password = await pageNew.waitForXPath("//*[@id=\"password\"]",{ visible: true });
//     if (password === null)
//     {
//         console.log('password field');
//     }
//     else{
//         await password.type(appSettings.password);
//         console.log('password');
//     }
//     //Clicked on login button
//     let btnSearch = await pageNew.waitForXPath("//*[@id=\"next\"]",{ visible: true });
//     if (btnSearch === null)
//     {
//         console.log('Search button is not showing');
//     }
//     else{
//         await btnSearch.click();
//         console.log('Clicked on search button');
//     }
//     // click reports
//     (await pageNew.waitForXPath("[Xpath for reports link]",{ visible: true })).click()
//     // click extract and print it <li>
//     (await pageNew.waitForXPath("[Xpath for extract and print it]",{ visible: true })).click()
//
//     // iterate links to be extracted {
//     //     click the link
//     //     select format in dropdown
//     //     click export
//     // }
//
//     // iterate through the reports downloaded
//     // send it to data-factory
// });
typeToInput = async(page, xPath,description, data) => {
    let element = await page.waitForXPath(xPath,{ visible: true });
    console.log(`manipulating ${description}`)
    await element.type(data);
}

app.get('/', async(req, res) => {
    const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('Launching browser');
        // const browser = await puppeteer.connect({  browserWSEndpoint: 'wss://chrome.browserless.io/'});
        const pageNew = await browser.newPage();
        
        // await pageNew.setViewport({ width: 1280, height: 800 });
        await pageNew.goto('https://ffdist-37bfa.web.app/reports');
        console.log('navigating');
        await typeToInput(pageNew,'//*[@id="mat-input-0"]', 'From Date', '6/1/2021');
        await typeToInput(pageNew, '//*[@id="mat-input-1"]' , "To Date", '6/30/2021');
        let unfocus = await pageNew.waitForXPath("/html/body/app-root/app-navbar/div/mat-sidenav-container/mat-sidenav-content/div",{ visible: true });
        await unfocus.click();
    
        let csv = []
        setTimeout(async () => {
            let flatData = await pageNew.evaluate(() => Array.from(document.querySelectorAll('table tr td'), element => element.textContent.trim()));
            let header = (await pageNew.evaluate(() => Array.from(document.querySelectorAll('table thead'), element => element.textContent.trim())))[0].split('  ');
            // push header
            csv.push(header[0]+','+header[1]+','+header
            [2]);
            // push child data
            for( let counter = 0 ; counter < flatData.length; ) {
                csv.push('\n'+flatData[counter]+','+flatData[counter+1]+','+flatData[counter+2]);
                counter = counter + 3;
            }
            const fileName = `data${Date.now()}.csv`;
            console.log('CSV BUILT');
            await upload(fileName, csv.toString());
            // const writeStream = fs.createWriteStream(fileName);
            // writeStream.write(csv.toString());
            // const stream = stream.Readable(csv.toString());
            // ref.put(stream).then((snapshot) => {
            //     console.log('Uploaded a blob or file!');
            // });
    
            console.log('Ended');
            browser.close();
            return true;
        }, 5000);
    res.send('ping');
})

const port = process.env.PORT || 8080;
app.listen(port, () => console.log('listening to http://localhost:8080'));