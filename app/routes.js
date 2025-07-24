const grades = [
  "A",
  "AF",
  "AA",
  "U"
]

const badGrades = [
  "AA",
  "U"
]

const goodGrades = [
  "A",
  "AF",
]

const reviewSections = [
  "Amendments",
  "Feedback"
]

const groups = [
  "evidence",
  "infoGather",
  "activities",
  "mobility",
  "opinion",
  "process",
  "Overallcomment"
]

const evidence = {
  evid: "Further evidence"
}

const infoGather = {
  history: "History (including variability)",
  exam: "Examination",
  observation: "Observations"
}

const activities = {
  food: "Preparing food",
  nutrition: "Taking nutrution",
  therapy: "Managing therapy",
  washing: "Washing and bathing",
  toilet: "Managing toilet needs",
  dressing: "Dressing and undressing",
  communicating: "Communication verbally",
  reading: "Reading and understanding",
  engaging: "Engaging with others",
  budgeting: "Making budgeting decisions"
}


const mobility = {
  journeys: "Planning and following journeys",
  moving: "Moving around"
}

const opinion = {
  Prognosis: "Prognosis",
  QPPT: "QP/PT recommendation",
  Terminal: "Terminal illness opinion",
  Reliability: "Reliability criteria",
  Justification: "Justification"
}

const process = {
  handling: "Case handling",
  Usability: "Usability"
}

const condition = {
  conditions: "Primary condition"
}

const Overallcomment = {
  com: "Overall comment"
}


//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Find an address plugin
const findAddressPlugin = require("find-an-address-plugin");

findAddressPlugin(router);

router.get("*", (req, res, next) => {
  res.locals.query = req.query;
  res.locals.activities = activities;
  res.locals.mobility = mobility;
  res.locals.infoGather = infoGather;
  res.locals.evidence = evidence;
  res.locals.opinion = opinion;
  res.locals.process = process;
  res.locals.Overallcomment = Overallcomment;
  res.locals.condition = condition;
  res.locals.reviewSections = reviewSections;
  res.locals.grades = grades;
  const currentGrades = Object.keys(res.locals.data)
                      .filter((x) => x.startsWith("grade-"))
                      .map((key) => res.locals.data[key].split("-")?.[0]?.trim());
  const lowestGrade = grades[Math.max(...currentGrades.map((grade => grades.indexOf(grade))))]; 
  res.locals.lowestGrade = lowestGrade;
  res.locals.requiresAmendment = Object.keys(res.locals.data)
                      .filter((x) => x.startsWith("grade-"))
                      .filter((key) => badGrades.includes(res.locals.data[key].split("-")?.[0]?.trim()));
  res.locals.groupsToAmend = groups.filter((group) => {
    const toAmend = res.locals.requiresAmendment.map((x) => x.split("-")[1]);
    return Object.keys(res.locals[group]).some(el => toAmend.includes(el));
  });
  res.locals.hasFeedback = Object.keys(res.locals.data)
                    .filter((x) => x.startsWith("grade-"))
                    .filter((key) => goodGrades.includes(res.locals.data[key].split("-")?.[0]?.trim()));
  res.locals.groupsWithFeedback = groups.filter((group) => {
    const hasFeedback = res.locals.hasFeedback.map((x) => x.split("-")[1]);
    return Object.keys(res.locals[group]).some(el => hasFeedback.includes(el));
  });
  console.log("Groups with feedback", res.locals.groupsWithFeedback);
  console.log(res.locals.hasFeedback);
  console.log("Groups to amend", res.locals.groupsToAmend);
  console.log(res.locals.requiresAmendment);
  return next();
})

// Logging session data  
// This code shows in the terminal what session data has been saved.
router.use((req, res, next) => {    
    const log = {  
      method: req.method,  
      url: req.originalUrl,  
      data: req.session.data  
    }  
    console.log(JSON.stringify(log, null, 2))  
   
  next()  
})  

// This code shows in the terminal what page you are on and what the previous page was.
router.use('/', (req, res, next) => {  
    res.locals.currentURL = req.originalUrl; //current screen  
    res.locals.prevURL = req.get('Referrer'); // previous screen
  
  console.log('folder : ' + res.locals.folder + ', subfolder : ' + res.locals.subfolder  );
  
    next();  
  });

  // Routing for the example journey. 
  router.post('/country-answer', function(request, response) {

    var country = request.session.data['country']
    if (country == "England"){
        response.redirect("example/complete")
    } else {
        response.redirect("example/ineligible")
    }
})

// Supporting docs

const versions = [
   'htln1322-Summarylistv1' 
]

console.log('Setting up main router. Locating sub routers');
versions.forEach((version) => require(`${__dirname}/views/${version}/routes/routes.js`));

router.all('*', (req, res, next) => {
    res.locals.params = req.params;
    res.locals.query = req.query;
    return next();
});