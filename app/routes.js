
const infoGather = {
  history: "History (including variability)",
  exam: "Examination",
  observation: "Observations"
}




const activities = {
  food: "Preparing Food",
  nutrition: "Taking nutrution",
  therapy: "Managing therapy",
  washing: "Washing and bathing",
  toilet: "Managing toilet needs",
  dressing: "Dressing and undressing",
  communicating: "Communication verbally",
  reading: "Reading and understanding",
  engaging: "Engaging with others",
  journeys: "Planning and following journeys",
  moving: "Moving around"
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
  res.locals.infoGather = infoGather;
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



  // Add your routes here