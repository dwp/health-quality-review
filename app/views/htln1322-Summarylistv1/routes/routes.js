const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const v8 = require("v8");
const currentVersionPath = __dirname.split('/')[__dirname.split('/').length - 2];
console.log(`Setting up router for version ${currentVersionPath}`);
let documents = v8.deserialize(v8.serialize(require('../data/documents.json')));
const documentNames = require('../data/documentNames.json');
const months = require('../data/months');

// Add your routes here
router.post(`/${currentVersionPath}`, (req, res, next) => {
    return res.redirect(`/${currentVersionPath}/claimant-details`);
});

router.get(`/${currentVersionPath}/reset-documents`, (req, res, next) => {
    documents = v8.deserialize(v8.serialize(require('../data/documents.json')));
    return res.redirect(`/${currentVersionPath}/document-list`);
});

router.all(`/${currentVersionPath}*`, (req, res, next) => {
    res.locals.currentVersionPath = currentVersionPath;
    res.locals.documents = documents.filter((doc) => !doc.archived);
    res.locals.irrelevantDocuments = documents.filter((doc) => doc.archived);
    res.locals.documentNames = documentNames;
    res.locals.totalDocuments = res.locals.documents.filter((x) => x.isActive).length;
    res.locals.importantCount = res.locals.documents.filter((x) => x.isActive && x.important).length;
    res.locals.archivedCount = res.locals.documents.filter((x) => x.isActive && x.archived).length;
    res.locals.unreadCount = res.locals.totalDocuments - res.locals.documents.filter((x) => x.isActive && x.read).length;
    res.locals.lastUpdatedTime = new Date().toLocaleString('en-GB', { hour: 'numeric', minute: 'numeric', hour12: true });
    return next();
});

router.get(`/${currentVersionPath}/view-document/:id`, (req, res, next) => {
    const docToUpdate = documents.find((doc) => doc.id === req.params.id);
    docToUpdate.read = true;
    res.locals.documents = documents;
    res.locals.document = res.locals.documents.find((doc) => doc.id === req.params.id);
    const filteredDocs = res.locals.documents.filter((x) => x.isActive);
    res.locals.selectedDocument = filteredDocs.findIndex((doc) => doc.id === req.params.id) + 1;
    res.locals.previousDocumentId = filteredDocs[res.locals.selectedDocument - 2]?.id;
    res.locals.nextDocumentId = filteredDocs[res.locals.selectedDocument]?.id;
    return res.render(`${currentVersionPath}/view-document`);
});

router.get(`/${currentVersionPath}/update-document/:id`, (req, res, next) => {
    const docToUpdate = documents.find((doc) => doc.id === req.params.id);
    docToUpdate.read = true;
    res.locals.documents = documents;
    res.locals.document = res.locals.documents.find((doc) => doc.id === req.params.id);
    const filteredDocs = res.locals.documents.filter((x) => x.isActive);
    res.locals.selectedDocument = filteredDocs.findIndex((doc) => doc.id === req.params.id) + 1;
    res.locals.previousDocumentId = filteredDocs[res.locals.selectedDocument - 2]?.id;
    res.locals.nextDocumentId = filteredDocs[res.locals.selectedDocument]?.id;
    return res.render(`${currentVersionPath}/update-document`);
});

router.post(`/${currentVersionPath}/update-document/:id`, (req, res, next) => {
    const docToUpdate = documents.find((doc) => doc.id === req.params.id);
    if (req.body.documentName) {
        docToUpdate.drsName = docToUpdate?.drsName || docToUpdate?.name?.slice(0);
        docToUpdate.name = req.body.documentName;
    }  
    docToUpdate.dateDay = req.body.dateOfDocumentDay;
    docToUpdate.dateMonth = req.body.dateOfDocumentMonth;
    docToUpdate.dateYear = req.body.dateOfDocumentYear;
    docToUpdate.comment = req.body.comment;
    if (months[req.body.dateOfDocumentMonth - 1]) {
         docToUpdate.dateOfDocument = `${req.body.dateOfDocumentDay} ${months[req.body.dateOfDocumentMonth - 1]} ${req.body.dateOfDocumentYear}`;
     }
    docToUpdate.reviewed = true;
    docToUpdate.archived = Array.isArray(req.body.archived);
    res.locals.documents = documents;
    res.locals.document = res.locals.documents.find((doc) => doc.id === req.params.id);
    const filteredDocs = res.locals.documents.filter((x) => x.isActive);
    res.locals.selectedDocument = filteredDocs.findIndex((doc) => doc.id === req.params.id) + 1;
    res.locals.previousDocumentId = filteredDocs[res.locals.selectedDocument - 2]?.id;
    res.locals.nextDocumentId = filteredDocs[res.locals.selectedDocument]?.id;
    if (req.query.irrelevant) {
        return res.redirect(`/${currentVersionPath}/document-list?irrelevant=true`);
    } else if (!req.query.ncat) {
        return res.redirect(`/${currentVersionPath}/view-document/${req.params.id}`);
    } else {
        if (res.locals.nextDocumentId) {
            return res.redirect(`/${currentVersionPath}/update-document/${res.locals.nextDocumentId}?ncat=true`);
        } else {
            return res.redirect(`/${currentVersionPath}/document-list?ncat=true`);
        }
    }
});

router.post(`/${currentVersionPath}/document-list`, (req, res, next) => {
    console.log(req.body);
    documents.forEach((document) => {
        if (req.body.documentFilters?.includes('IMPORTANT')) {
            document.isActive = document.important;
        }
        if (req.body.documentFilters?.includes('ARCHIVED')) {
            document.isActive = document.archived;
        }
        if (req.body.documentFilters?.includes('UNREAD')) {
            document.isActive = !document.read;
        }
    });
    return res.redirect(`/${currentVersionPath}/document-list`);
});

router.get(`/${currentVersionPath}/clear-filters`, (req, res, next) => {
    console.log(req.body);
    res.locals.data.documentFilters = [];
    documents.forEach((doc) => doc.isActive = true);
    res.locals.documents = documents;
    res.locals.totalDocuments = res.locals.documents.filter((x) => x.isActive).length;
    res.locals.importantCount = res.locals.documents.filter((x) => x.important).length;
    res.locals.archivedCount = res.locals.documents.filter((x) => x.archived).length;
    res.locals.unreadCount = res.locals.totalDocuments - res.locals.documents.filter((x) => x.read).length;
    return res.render(`${currentVersionPath}/document-list`);
});


router.post(`/${currentVersionPath}/autosave`, function (req, res) {
    try {
        const docToUpdate = documents.find((doc) => doc.id === req.body.id);
        if (req.body.type === 'archived') {
            docToUpdate.archived = req.body.isChecked;
        } else {
            docToUpdate.important = req.body.isChecked;;
        }
        res.locals.documents = documents;
        return res.status(200).json({});
    } catch (error) {
        return res.status(500).json({});
    }
});