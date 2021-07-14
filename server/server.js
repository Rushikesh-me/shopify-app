import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion } from "@shopify/shopify-api";
import {receiveWebhook, registerWebhook} from '@shopify/koa-shopify-webhooks'
import Koa from "koa";
import koaBody from 'koa-body';
import next from "next";
import Router from "koa-router";
import nodemailer from 'nodemailer';

dotenv.config();


const {SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SCOPES, HOST, EMAIL, PASS} = process.env
const port = parseInt(process.env.PORT, 10) ||3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();

Shopify.Context.initialize({
  API_KEY: SHOPIFY_API_KEY,
  API_SECRET_KEY: SHOPIFY_API_SECRET,
  SCOPES: SCOPES.split(","),
  HOST_NAME: HOST.replace(/https:\/\//, ""),
  API_VERSION: ApiVersion.April21,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};

app.prepare().then(async () => {
  const server = new Koa();
  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];
  server.use(
    createShopifyAuth({
      async afterAuth(ctx) {
        // Access token and shop available in ctx.state.shopify
        const { shop, accessToken, scope } = ctx.state.shopify;
        const host = ctx.query.host;
        ACTIVE_SHOPIFY_SHOPS[shop] = scope;

        const customersCreation = await registerWebhook({
          address: `${HOST}/webhooks/customers/create`,
          topic: 'CUSTOMERS_CREATE',
          accessToken,
          shop,
          apiVersion: ApiVersion.April21
        });

        if (customersCreation.success) {
          console.log('Listening to customers creation');
        } else {
          console.log('Failed to listen to customerscreation', registration.result);
        }

        ctx.redirect(`/?shop=${shop}&host=${host}`);
      },
    })
  );

  const handleRequest = async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

  const webhook = receiveWebhook({ secret: SHOPIFY_API_SECRET });

  router.post("/webhooks/customers/create",webhook, async (ctx) => {
   const customerData = await ctx.state.webhook;
   const mailTo = await customerData.payload.email;
   console.log(mailTo)
   const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL,
      pass: PASS,
    },
  });
  const mailOptions = {
    from: EMAIL,
    to: mailTo,
    subject: "Mail from Rushikesh's Shopify app", 
    html: `<div>
    <h1>Welcome</h1>
    <h2>Welcome to rushikesh's app<h2>`
  };

  transport.sendMail(mailOptions, function (err, info) {
    if(err)
      {throw new Error(err)}
    else
      {console.log(info)}
 });

  });

  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );
  router.post('/productDiscount/email', koaBody(), (ctx, next) => {
    const data = ctx.request.body
    const mailTo = data.mailto;
    const coupon = data.coupon;
    const product = data.product;
    ctx.respond = false;
   const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL,
      pass: PASS,
    },
  });
  const mailOptions = {
    from: EMAIL,
    to: mailTo,
    subject: "Prodct Discount from Rushikesh's Shopify app", 
    html: `<div>
    <h1>Discount offer for you</h1>
    <h2>Use coupon ${coupon} for special discount on ${product}<h2>`
  };
if(mailTo){
  transport.sendMail(mailOptions, function (err, info) {
    if(err)
      {
        console.log(err);
        throw new Error(err) 
        
      }
    else
      {
        console.log(info);
        ctx.body = info
        ctx.respond.statusCode = 200
      }
 })} else {
   console.log("No email found")
   throw new Error("No email found")
 }  
  })

  router.get("(/_next/static/.*)", handleRequest); 
  router.get("/_next/webpack-hmr", handleRequest);
  router.get("(.*)", async (ctx) => {
    const shop = ctx.query.shop;

    if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      await handleRequest(ctx);
    }
  });

  server.use(router.allowedMethods());
  server.use(router.routes());
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
