const jwt = require('jsonwebtoken');

const {AUTH_SECRET} = process.env;

const auth = (req, res, next) => {

    // destructuring auth_token from req.cookies object
    const {auth_token} = req.cookies;

    // Side-Note: 
    // In some cases/apps, we might not have access to cookies( like mobile-apps)
    // so we will need to send auth_token in request's header under "Authorization" key.
    // 
    // Authorization : "Bearer <auth-token-Value>"
    // 
    // In this kind of case, we fetch the auth_token like below:
    // const auth_token = req.header("Authorization").replace("Bearer","");
    //
    // Side-Note ends.

    // proceed further only if auth_token exists
    if(!auth_token){
        res.status(400).send("Auth Token is Missing! Please login and try again.")
    }

    try {
        // check if auth_token is valid or not
        var decoded = jwt.verify(auth_token, AUTH_SECRET);

        // add user/decoded object's data to req object
        req.user = decoded;

    } catch(err) {
        // if invalid auth_token:
        res.status(403).send("Auth Token is Invalid! Please login and try again.");
    }

    return next();
}

module.exports = auth;