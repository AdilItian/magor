// Dummy axios setup
const axios = require("axios");
const MockAdapter = require('axios-mock-adapter');

// Dummy mongoose setup
const mongoose = require('mongoose');
const dbHandler = require('../test_config/config/mockdb');
const dummy = require('../test_config/data/user');
const User = require('../../models/user');

// Supertest setup
const request = require('supertest');
const app = require('../../../server');

// Constants

const hostname = 'https://gateway.speechlab.sg';
const registerPath = '/auth/register';
const loginPath = '/auth/login';

describe('integration/register', () => {
    let mock;
    /**
    * Connect to a new in-memory database before running any tests.
    */
    beforeAll(async () => {
        await dbHandler.connect();
        mock = new MockAdapter(axios);
    });
    /**
     * Clear all test data after every test.
     */
    afterEach(async () => await dbHandler.clearDatabase());
    /**
     * Remove and close the db and server.
     */
    afterAll(async (done) => {
        await dbHandler.closeDatabase();
        done();
    });
    test('should return 200 if data is valid', async () => {
        const mockID = "hello";
        mock.onPost(`${hostname}${registerPath}`).reply(200, { _id: mockID });
        const data = dummy.register.success;
        const response = await request(app).post('/register').send(data);
        expect(response.status).toBe(201);
        const body = response.body;
        expect(body).toHaveProperty("token", "unavailable");
        expect(body).toHaveProperty("user");
        expect(body.user).toHaveProperty("_id", mockID);
        expect(body.user).toHaveProperty("verification");
        expect(body.user).toHaveProperty("name", data.name);
        expect(body.user).toHaveProperty("email", data.email);
        expect(body.user).toHaveProperty("role", "user");
    });
    test('should return 422 on validation failure', async() => {
        const mockID = "hello";
        mock.onPost(`${hostname}${registerPath}`).reply(200, { _id: mockID });
        // create copy of object
        const data = {...dummy.register.success};
        delete data.name;
        data.password = "tiny";
        const response = await request(app).post('/register').send(data);
        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty("errors");
        expect(response.body.errors).toHaveProperty("msg");
    });
    test('should return 422 on duplicate email', async() => {
        const mockID = "hello";
        mock.onPost(`${hostname}${registerPath}`).reply(200, { _id: mockID });
        const data = dummy.register.success;
        // Set up user
        const firstRes = await request(app).post('/register').send(data);
        expect(firstRes.status).toBe(201);
        // Test duplicate email
        const secondRes = await request(app).post('/register').send(data);
        expect(secondRes.status).toBe(422);
    });
});

describe('integration/login', () => {
    let mock;
    /**
    * Connect to a new in-memory database before running any tests.
    */
    beforeAll(async () => {
        await dbHandler.connect();
        mock = new MockAdapter(axios);
    });
    /**
     * Clear all test data after every test.
     */
    afterEach(async () => await dbHandler.clearDatabase());
    /**
     * Remove and close the db and server.
     */
    afterAll(async (done) => {
        await dbHandler.closeDatabase();
        done();
    });
    test('should return 200 on valid data', async () => {
        const mockAccessToken = "token123";
        mock.onPost(`${hostname}${loginPath}`).reply(200, {accessToken: mockAccessToken});
        // Pretest setup - Add user to database
        const registeredUser = {...dummy.login.dummy1};
        await new User(registeredUser).save();
        // Test login
        const res = await request(app)
                            .post(`/login`)
                            .send({
                                email: registeredUser.email,
                                password: registeredUser.password
                            });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token', mockAccessToken);
        expect(res.body).toHaveProperty("user");
        expect(res.body.user).toHaveProperty("_id", registeredUser._id);
        expect(res.body.user).toHaveProperty("verification");
        expect(res.body.user).toHaveProperty("name", registeredUser.name);
        expect(res.body.user).toHaveProperty("email", registeredUser.email);
        expect(res.body.user).toHaveProperty("role", "user");
    });

    test('should return 401 on incorrect password', async () => {
        mock.onPost(`${hostname}${loginPath}`).reply(401, {message: "unauthorized"});
        // Pretest setup - Add user to database
        const registeredUser = {...dummy.login.dummy1};
        await new User(registeredUser).save();
        // Test login
        const res = await request(app)
                            .post(`/login`)
                            .send({
                                email: registeredUser.email,
                                password: `${registeredUser.password}error`
                            });
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty("code", 401);
        expect(res.body).toHaveProperty("message", "\"incorrect password\"");
    });

    test('should return 404 on user not found', async () => {
        const res = await request(app)
                            .post(`/login`)
                            .send({
                                email: "existential@crisis.com",
                                password: "idiedlongago"
                            });
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty("code", 404);
        expect(res.body).toHaveProperty("message", "\"user not found\"");
    });
});

describe('integration/getUser', () => {
    let mock;
    /**
    * Connect to a new in-memory database before running any tests.
    */
    beforeAll(async () => {
        await dbHandler.connect();
        mock = new MockAdapter(axios);
    });
    /**
     * Clear all test data after every test.
     */
    afterEach(async () => await dbHandler.clearDatabase());
    /**
     * Remove and close the db and server.
     */
    afterAll(async (done) => {
        await dbHandler.closeDatabase();
        done();
    });

    test('should return 200 on valid token', async () => {
        const registeredUser = {...dummy.login.dummy1};
        // Pretest setup - Add user to database
        await new User(registeredUser).save();
        // Test login
        const res = await request(app)
                            .get(`/`)
                            .set('authorization', `Bearer test_${registeredUser._id}`);         
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("role", "user");
        expect(res.body).toHaveProperty("name", registeredUser.name);
        expect(res.body).toHaveProperty("email", registeredUser.email);
    });

    test('should return 404 on invalid token', async () => {
        const registeredUser = {...dummy.login.dummy1};
        // Pretest setup - Add user to database
        await new User(registeredUser).save();
        // Test login
        const res = await request(app)
                            .get(`/`)
                            .set('authorization', `Bearer ${registeredUser._id}error`);         
        expect(res.status).toBe(404);
    });
});

// TODO integration/verify
// TODO integration/token
