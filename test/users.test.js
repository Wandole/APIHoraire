const supertest = require("supertest");
const app = require("../server");

const User = require("../models/user.model");
const { setupDB } = require("./test-setup");
const userSeed = require("./seed/user.seed");
const { genStringWithLength } = require("../heplers/function");
const datasUser = require("../config/datas.json").models.users;

// Open a db with the given name, manage db's datas during and after testing. Add seed if needed.
setupDB("User", userSeed, true);

/*     USER GET     */
/*==================*/
test("GET /users/all get all users", async () => {
  try {
    let reponse = await supertest(app).get("/users/all").expect(200);
    expect(Array.isArray(reponse.body.datas)).toBeTruthy();
    expect(reponse.body.datas.length).toBe(userSeed.length);
  } catch (err) {
    throw err;
  }
});

test("GET /users/all get all users when db is empty", async () => {
  try {
    // Empties user collection in db before test
    await User.deleteMany();

    let reponse = await supertest(app).get("/users/all").expect(200);
    expect(Array.isArray(reponse.body.datas)).toBeTruthy();
    expect(reponse.body.datas.length).toBe(0);
  } catch (err) {
    throw err;
  }
});

test("GET /users/get/:id get a user with the given id", async () => {
  try {
    let newUser = await User.create({
      username: "user test",
      password: "un mdp",
    });

    let reponse = await supertest(app)
      .get(`/users/get/${newUser._id}`)
      .expect(200);

    // Request success from API
    expect(reponse.body.success).toBeTruthy();

    // Datas sent by API are correct
    expect(reponse.body.datas).toBeDefined();
    expect(reponse.body.datas.username).toBe(newUser.username);
    expect(reponse.body.datas._id).toBe(newUser.id);
    expect(reponse.body.datas.password).toBe(newUser.password);
  } catch (err) {
    throw err;
  }
});

test("GET /users/get/:id where no result is found", async () => {
  try {
    let reponse = await supertest(app)
      // The id have the correct format
      .get(`/users/get/625b1bf85ce58741b994c683`)
      .expect(204);

    // The results is not the one expected
    expect(reponse.body.success).toBeFalsy();

    // No datas has been sent
    expect(reponse.body.datas).toBeUndefined();
  } catch (err) {
    throw err;
  }
});

test("POST/DELETE/PUT test new_user validation of datas", async () => {
  try {
    // No username
    let userTest1 = {
      username: genStringWithLength(0),
      password: genStringWithLength(datasUser.password.minlength),
    };
    // No password
    let userTest2 = {
      username: genStringWithLength(datasUser.username.minlength),
      password: genStringWithLength(0),
    };
    // Username too short
    let userTest3 = {
      username: genStringWithLength(datasUser.username.minlength - 1),
      password: genStringWithLength(datasUser.password.minlength),
    };
    // Password too short
    let userTest4 = {
      username: genStringWithLength(datasUser.username.minlength),
      password: genStringWithLength(datasUser.password.minlength - 1),
    };
    // Username too long
    let userTest5 = {
      username: genStringWithLength(datasUser.username.maxlength + 1),
      password: genStringWithLength(datasUser.password.minlength),
    };
    //Password too long
    let userTest6 = {
      username: genStringWithLength(datasUser.username.minlength),
      password: genStringWithLength(datasUser.password.maxlength + 1),
    };
    // Username at max length
    let userTest8 = {
      username: genStringWithLength(datasUser.username.maxlength),
      password: genStringWithLength(datasUser.password.minlength),
    };
    // Password with max length
    let userTest9 = {
      username: genStringWithLength(datasUser.username.minlength),
      password: genStringWithLength(datasUser.password.maxlength),
    };

    await supertest(app).post("/users/add").send(userTest1).expect(400);
    await supertest(app).post("/users/add").send(userTest2).expect(400);
    await supertest(app).post("/users/add").send(userTest3).expect(400);
    await supertest(app).post("/users/add").send(userTest4).expect(400);
    await supertest(app).post("/users/add").send(userTest5).expect(400);
    await supertest(app).post("/users/add").send(userTest6).expect(400);
    await supertest(app).post("/users/add").send(userTest8).expect(201);
    await supertest(app).post("/users/add").send(userTest9).expect(201);
  } catch (err) {
    throw err;
  }
});

/*     USER POST    */
/*==================*/
test("POST /users/add post new user in db", async () => {
  try {
    let userTest = {
      username: "Test1",
      password: "Lorem ipsum",
    };

    let reponse = await supertest(app)
      .post("/users/add")
      .send(userTest)
      .expect(201);

    /// User has been created by API
    expect(reponse.body.success).toBeTruthy();
    expect(reponse.body.message).toBe("User created");

    let userFound = await User.findOne({ username: userTest.username });

    // User is in DB
    expect(userFound).not.toBeNull();
    expect(userFound.username).toBe(userTest.username);
  } catch (err) {
    throw err;
  }
});

test("POST /users/add add doublon", async () => {
  try {
    let reponse = await supertest(app)
      .post("/users/add")
      .send({
        username: "Shion",
        password: "Lorem ipsum",
      })
      .expect(400);

    // The results is not the one expected (user not created)
    expect(reponse.body.success).toBeFalsy();
  } catch (err) {
    throw err;
  }
});

/*     USER PUT     */
/*==================*/
test("PUT /users/update/:id Update a user's datas", async () => {
  try {
    // Create a new user
    let newUser = await User.create({
      username: "Test maj",
      password: "azeazeaz",
    });

    // Try to update this user
    const majUsername = "updated";
    let reponse = await supertest(app)
      .post(`/users/update/${newUser._id}`)
      .send({
        username: majUsername,
        password: "12345678",
      })
      .expect(201);

    // API made the change expected
    expect(reponse.body.success).toBeTruthy();

    // Check if changes are in the DB
    let majUser = await User.findById(newUser._id);
    expect(majUser.username).toBe(majUsername);

    //Password has been hashed. Check if current one is different than the initial one
    expect(majUser.password).not.toBe(newUser.password);
  } catch (err) {
    throw err;
  }
});

test("PUT /users/update/:id Update a user with wrong id", async () => {
  try {
    // Create a new user
    let newUser = await User.create({
      username: "Test maj",
      password: "azeazeze",
    });

    // Try to update this user
    const majUsername = "updated";
    let reponse = await supertest(app)
      .post(`/users/update/625b1bf85ce58741b994c626`)
      .send({
        username: majUsername,
        password: "12345678",
      })
      .expect(204);

    // API has not made the change expected
    expect(reponse.body.success).toBeFalsy();

    // Check that changes are not in the DB
    let majUser = await User.findById(newUser._id);
    expect(majUser.username).not.toBe(majUsername);

    //Password has been hashed. Check if current one is the same than the initial one
    expect(majUser.password).toBe(newUser.password);
  } catch (err) {
    throw err;
  }
});

test("PUT /users/update/:id Update a user with a username already in use", async () => {
  try {
    // Create a new user
    let newUser = await User.create({
      username: "Test maj",
      password: "azeazeze",
    });

    // Try to update this user
    const majUsername = "updated";
    let reponse = await supertest(app)
      .post(`/users/update/${newUser._id}`)
      .send({
        username: "Shion",
        password: "12345678",
      })
      .expect(400);

    // API has not made the change expected
    expect(reponse.body.success).toBeFalsy();

    // Check that changes are not in the DB
    let majUser = await User.findById(newUser._id);
    expect(majUser.username).not.toBe(majUsername);

    //Password has been hashed. Check if current one is the same than the initial one
    expect(majUser.password).toBe(newUser.password);
  } catch (err) {
    throw err;
  }
});
/*    USER DELETE   */
/*==================*/
test("DELETE /users/delete/:id Delete a user", async () => {
  try {
    // Take a user from db
    let user = await User.findOne();
    // Try to delete a user
    let reponse = await supertest(app)
      .delete(`/users/delete/${user.id}`)
      .send({ username: user.username, password: user.password })
      .expect(200);

    // API made the change expected
    expect(reponse.body.success).toBeTruthy();

    // Check if user has been deleted of the DB
    let delUser = await User.findById(user._id);
    expect(delUser).toBeNull();
  } catch (err) {
    throw err;
  }
});

test("DELETE /users/delete/:id Delete a user without being the user", async () => {
  try {
    // Take a user from db
    let user = await User.findOne();
    // Try to delete a user
    let reponse = await supertest(app)
      .delete(`/users/delete/${user.id}`)
      .send({ username: "patate", password: "la grosse patate" })
      .expect(401);

    // Check that user has not been deleted of the DB
    let delUser = await User.findById(user._id);
    expect(delUser.username).toBe(user.username);
    expect(delUser.password).toBe(user.password);
  } catch (err) {
    throw err;
  }
});
