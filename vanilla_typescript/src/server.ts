/*
server.js – Configures the Plaid client and uses Express to defines routes that call Plaid endpoints in the Sandbox environment.
Utilizes the official Plaid node.js client library to make calls to the Plaid API.
*/
import dotenv from "dotenv";
import express, {
  ErrorRequestHandler,
  Request,
  Response,
  Application,
  NextFunction,
} from "express";
import bodyParser from "body-parser";
import session from "express-session";
import {
  Configuration,
  CountryCode,
  LinkTokenCreateRequest,
  PlaidApi,
  PlaidEnvironments,
  PlaidError,
  Products,
} from "plaid";
import path from "path";

dotenv.config();
const app: Application = express();

// Let's tell TypeScript we're adding a new property to the session
// Again, don't ever do this in production
declare module "express-session" {
  interface SessionData {
    access_token?: string;
  }
}

app.use(
  // FOR DEMO PURPOSES ONLY
  // Use an actual secret key in production
  session({
    secret: "use-a-real-secret-key",
    saveUninitialized: true,
    resave: true,
  })
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", async (_: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/oauth", async (_: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "oauth.html"));
});

// Configuration for the Plaid client
const environmentName = process.env.PLAID_ENV ?? "sandbox";

const config = new Configuration({
  basePath: PlaidEnvironments[environmentName],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
      "Plaid-Version": "2020-09-14",
    },
  },
});

//Instantiate the Plaid client with the configuration
const client: PlaidApi = new PlaidApi(config);

//Creates a Link token and return it
app.get(
  "/api/create_link_token",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const linkConfigObject: LinkTokenCreateRequest = {
        user: { client_user_id: req.sessionID },
        client_name: "Plaid's Tiny Quickstart",
        language: "en",
        products: [Products.Auth],
        country_codes: [CountryCode.Us],
        redirect_uri: process.env.PLAID_SANDBOX_REDIRECT_URI,
      };
      const tokenResponse = await client.linkTokenCreate(linkConfigObject);
      res.json(tokenResponse.data);
    } catch (error) {
      next(error);
    }
  }
);

// Exchanges the public token from Plaid Link for an access token
app.post(
  "/api/exchange_public_token",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const exchangeResponse = await client.itemPublicTokenExchange({
        public_token: req.body.public_token,
      });

      // FOR DEMO PURPOSES ONLY
      // Store access_token in DB instead of session storage
      req.session.access_token = exchangeResponse.data.access_token;
      res.json(true);
    } catch (error) {
      next(error);
    }
  }
);

// Fetches balance data using the Node client library for Plaid
app.get(
  "/api/data",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const access_token = req.session.access_token ?? "";
      const balanceResponse = await client.accountsBalanceGet({
        access_token: access_token,
      });
      res.json({
        Balance: balanceResponse.data,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Checks whether the user's account is connected, called
// in index.html when redirected from oauth.html
app.get(
  "/api/is_account_connected",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      return req.session.access_token
        ? res.json({ status: true })
        : res.json({ status: false });
    } catch (error) {
      next(error);
    }
  }
);

type PotentialPlaidError = Error & {
  response?: {
    data?: any;
  };
};

const errorHandler: ErrorRequestHandler = (
  err: PotentialPlaidError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`Received an error for ${req.method} ${req.path}`);
  if (err.response) {
    const plaidError: PlaidError = err.response.data;
    console.error(err.response.data);
    res.status(500).send(plaidError);
  } else {
    console.error(err);
    res.status(500).send({
      error_code: "OTHER_ERROR",
      error_message: "I got some other message on the server.",
    });
  }
};

app.use(errorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
