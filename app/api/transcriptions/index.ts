import { Hono } from 'hono';

const transcriptions = new Hono();

transcriptions.get('/transcriptions', (c) => {
    return c.json({
        message: "Transcriptions fetched",
        results: []
    }, 200)
});

transcriptions.get('/transcriptions/:id', (c) => {
    const id = c.req.param("id")


    return c.json({
        message: "Transcription fetched",
        result: {}
    }, 200)
   
});

transcriptions.post('/transcriptions', (c) => {
    return c.json({
        message: "Transcription created",
    }, 201)
});

export default transcriptions