const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
const surveys = [];
const responses = {};


app.get('/surveys', (req, res) => {
    res.send(surveys);
});

app.post('/surveys', (req, res) => {
    const { title, questions } = req.body;

    if (questions.length !== 20) {
        return res.status(400).send("Exactly 20 questions are required.");
    }

    const survey = {
        id: `${Date.now()}`,
        title,
        questions
    };

    surveys.push(survey);
    res.status(201).send(survey);
});


app.post('/responses/:candidateName', (req, res) => {
    const { surveyId, answers } = req.body;
    const candidateName = req.params.candidateName;

    if (!surveys.find(s => s.id === surveyId)) {
        return res.status(400).send("Invalid survey ID.");
    }

    if (answers.length > 20) {
        return res.status(400).send("You can only answer up to 20 questions.");
    }

    if (!responses[surveyId]) {
        responses[surveyId] = {};
    }

    responses[surveyId][candidateName] = answers;
    res.status(201).send({ message: "Response recorded!" });
});


app.get('/similarity', (req, res) => {
    const { surveyId, filterName, page = 1, search } = req.query;
    const pageSize = 5;

    if (!responses[surveyId]) {
        return res.status(404).send("Survey not found.");
    }

    const candidates = Object.keys(responses[surveyId]);
    let results = [];

    for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
            const similarity = calculateSimilarity(responses[surveyId][candidates[i]], responses[surveyId][candidates[j]]);
            results.push({
                candidates: [candidates[i], candidates[j]],
                similarity
            });
        }
    }

    if (filterName) {
        results = results.filter(r => r.candidates.includes(filterName));
    }

    if (search) {
        const searchTerm = search.toLowerCase();
        results = results.filter(r => r.candidates.some(name => name.toLowerCase().includes(searchTerm)));
    }

    const startIndex = (page - 1) * pageSize;
    const paginatedResults = results.slice(startIndex, startIndex + pageSize);

    res.send(paginatedResults);
});

function calculateSimilarity(responsesA, responsesB) {
    let matchingAnswers = 0;
    let totalComparableQuestions = 0;

    responsesA.forEach((responseA, index) => {
        const responseB = responsesB[index];

        if (responseA !== null && responseB !== null) {
            totalComparableQuestions++;

            if (responseA === responseB) {
                matchingAnswers++;
            }
        }
    });

    return (matchingAnswers / totalComparableQuestions) * 100;
}

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
