const analyzeButton = document.getElementById("analyze-btn")
const urlInput = document.getElementById("url-input")
const result = document.getElementById("results")
const resultLab = document.getElementById('result-lab')
const resultSeo = document.getElementById('result-seo')
const resultCrux = document.getElementById('result-crux')
const apiKey = 'AIzaSyDyacIv-fMaJhQoq8uUa4vzALjJzGn7beY'
const mainResult = document.getElementById('mainResult-Tab')
const firstPage = document.getElementById('first-page')
const secondPage = document.getElementById('second-page')



analyzeButton.addEventListener("click",async () => {
    let targetUrl = urlInput.value.trim();

    if(!targetUrl){
        alert("Please enter a valid URL.")
        return;
    }

    if(!/^https?:\/\//i.test(targetUrl)){
        targetUrl =`https:${targetUrl}`;
    }
    try {
        const parsedUrl = new URL(targetUrl);
        // Strips marketing query parameters (?utm_source, ?gclid, etc.)
        targetUrl = parsedUrl.origin + parsedUrl.pathname; 
    } catch (e) {
        console.warn("URL parsing error:", e);
    }

    firstPage.classList.add('has-analyzing');
    analyzeButton.disabled = true;
    resultLab.innerText = "Analayzing perforamnce...."
    resultSeo.innerText = "Analayzing Seo...."
    resultCrux.innerText = "Analayzing Crux Field...."
    
    const PageInsightEndpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`
    try{
        const url = `${PageInsightEndpoint}?url=${encodeURIComponent(targetUrl)}&key=${apiKey}&category=performance&category=seo&category=accessibility&category=best-practices`
        const response = await fetch(url);
        if(!response.ok){
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP Error ${response.status}`)
        }
        const data = await response.json();
        
        firstPage.classList.toggle('active')
        secondPage.classList.toggle('active')

        Renderresults(data);
        console.log(data);
    }catch(err){
        console.error("PageSpeed API Error:",err)
        // firstPage.classList.remove('analyzing');
        alert(`Failed to analyze URL:\n${err.message}\n\nNote: Some sites (like awwwards.com,instagram.com) block PageSpeed crawlers.`);

        resultLab.innerHTML = `<p style="color:red"><strong>Error:</strong>${err.message}</p>`
        resultSeo.innerText = "Failed to load SEO data.";
        resultCrux.innerText = "Failed to load CrUX data.";
    }finally{
        analyzeButton.disabled = false;
    }

}
)

function formatBytes(bytes){
    if(!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B','KB','MB','GB']
    const i = Math.floor(Math.log(bytes)/Math.log(k))
    return parseFloat((bytes/Math.pow(k,i).toFixed(2)+ ' ' + sizes[i]))
}
function getResourceSummary(data){
    const audits = data.lighthouseResult?.audits || {};
    const summaryAudits = audits['resource-summary'];
    const summaryItems = summaryAudits?.details?.items || [];

    const categories = summaryItems.map(item=>({
        type:item.label,
        count:item.requestCount,
        size:formatBytes(item.transferSize),
        rawBytes:item.transferSize
    }))
    return categories
}
function getScoreClass(score){
    if(score === 'N/A' || isNaN(score)) return '';
    if(score >=90)return 'score-good';
    if(score>=50)return 'score-average';
    return 'score-poor';
}
function getCruxClass(category) {
    if (!category) return '';
    const cat = category.toUpperCase();
    if (cat === 'FAST') return 'score-good';
    if (cat === 'AVERAGE' || cat === 'NEEDS_IMPROVEMENT') return 'score-average';
    if (cat === 'SLOW' || cat === 'POOR') return 'score-poor';
    return '';
}
function Renderresults(data){
    const {id} = data
    //lab
    const lighthouse = data.lighthouseResult;
    //Crux
    const loadingExp = data.loadingExperience;
    const categories = lighthouse?.categories || {}
    const audit = lighthouse?.audits || {};
   

    //Scores
    const perfScore = categories.performance ? Math.round(categories.performance.score * 100) : "N/A"
    const seoScore = categories.seo ? Math.round(categories.seo.score * 100) : 'N/A'
    const a11yScore = categories.accessibility ? Math.round(categories.accessibility.score * 100) : 'N/A'
    const bestScore = categories['best-practices'] ? Math.round(categories['best-practices'].score * 100) : 'N/A'



    //Lab scores
    const score = perfScore
    const fcp = audit['first-contentful-paint']?.displayValue || 'N/A';
    const lcp = audit['largest-contentful-paint']?.displayValue || 'N/A';
    const cls = audit['cumulative-layout-shift']?.displayValue || 'N/A';
    const tbt = audit['total-blocking-time']?.displayValue || 'N/A';
    const totalbiteSize = audit['total-byte-weight']?.displayValue || 'N/A' 
    const serverresponseTime = audit['server-response-time']?.displayValue || "N/A"
    const speedIndex = audit['speed-index']?.displayValue || "N/A"

    //Se0
    const seoscore = lighthouse.categories.seo? Math.round(lighthouse.categories.seo.score * 100) : 'N/A';
    const docTitleCheck = audit['document-title']?.score === 1 ? 'Optimal' : 'Missing/Needs Work';
    const metaDescCheck = audit['meta-description']?.score === 1 ? 'Present' : 'Missing';
    const viewportCheck = audit['viewport']?.score === 1 ? 'Configured' : 'Not Configured';
    const httpStatus = audit['http-status-code']?.displayValue || '200 (OK)';
       

    //Crux
    const metrics = loadingExp?.metrics || {};
    const overall = loadingExp?.overall_category || "No Field Data Avaialable"
    const inppercent = metrics['INTERACTION_TO_NEXT_PAINT']?.percentile || "N/A"
    const inpcat = metrics['INTERACTION_TO_NEXT_PAINT']?.category || "N/A"
    const clsCrux  = metrics['CUMULATIVE_LAYOUT_SHIFT_SCORE']?.percentile || 'N/A'
    const clsCategory = metrics['CUMULATIVE_LAYOUT_SHIFT_SCORE']?.category || 'N/A';
    const lcpCrux = metrics['LARGEST_CONTENTFUL_PAINT_MS']?.percentile || 'N/A' ;
    const lcpCategroy = metrics['LARGEST_CONTENTFUL_PAINT_MS']?.category || 'N/A' 

    

    mainResult.innerHTML = `<div class="pforMain">
                            <p>Website Name: <strong>${targetUrl}</strong></p>
                            <p>Performance: <strong>${perfScore}</strong></p>
                            <p>SEO: <strong>${seoScore}</strong></p>
                            <p>Accessibility: <strong>${a11yScore}</strong></p>
                            <p>Best practices: <strong>${bestScore}</strong></p>
                            </div>`
    document.getElementById('main-results').className = getScoreClass(perfScore);


    resultLab.innerHTML =`<div class="pforLab">
                        <p>Overall Score:<strong>${score}%</strong></p>
                        <p>First-Content-paint:<strong>${fcp}</strong></p>
                        <p>Largest-Contentful-Paint:<strong>${lcp}</strong></p>
                        <p>Cumulative-Layout-Shift:<strong>${cls}</strong></p>
                        <p>Total-Blocking-Time:<strong>${tbt}</strong></p>
                        <p>Total-Byte-Weight:<strong>${totalbiteSize}</strong></p>
                        <p>Speed-Index: <strong>${speedIndex}</strong></p>
                        <p>Server-Response-time: <strong>${serverresponseTime}</strong></p>
                        </div>`
    document.getElementById('result-lab-section').className = getScoreClass(score);
    
    resultSeo.innerHTML=`<div class="pforSEO">
                        <p>SEO Score: <strong>${seoscore}</strong></p>
                        <p>Document Title: <strong>${docTitleCheck}</strong></p>
                        <p>Meta Description: <strong>${metaDescCheck}</strong></p>
                        <p>Viewport Tag: <strong>${viewportCheck}</strong></p>
                        <p>HTTP Status Code: <strong>${httpStatus}</strong></p>
                        </div>
                        `
    document.getElementById('result-seo-section').className = getScoreClass(seoScore)

    resultCrux.innerHTML = `<div class="pforCrux">
                            <p>Overall Grade:<strong>${overall}</strong></p>
                            <p>Cumulative-Layout-Shift:<strong>${clsCrux}</strong></p>
                            <p>Cumulative-Layout-Shift Category:<strong>${clsCategory}</strong></p>
                            <p>Interaction-to-next-paint:<strong>${inppercent}</strong></p>
                            <p>Interation-to-next-paint Category:<strong>${inpcat}</strong></p>
                            <p>Largest-Contentful-paint:<strong>${lcpCrux}</strong></p>
                            <p>Largest-Contentful-paint Category:<strong>${lcpCategroy}</strong></p>
                            </div>`
                            document.getElementById('result-crux-section').className = getCruxClass(overall);
}
