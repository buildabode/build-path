import * as Koa from "koa";
import * as logger from "koa-logger";
import * as bodyParser from "koa-bodyparser";
import * as views from "koa-views";
import * as path from "path";
import { safeLoad } from "js-yaml";
import { readFileSync } from "fs";

import { Context } from "koa";

const app = new Koa();

let config: {
  path: {
    slug: string;
    actions: {
      text: string;
      to: string;
    }[];
  }[];
};

try {
  config = safeLoad(
    readFileSync(path.join(__dirname, "..", "path.yml"), "utf8")
  );
} catch (e) {
  console.log(e);
}

app.use(logger());
app.use(bodyParser());
app.use(views(__dirname, { extension: "pug" }));
app.use(async (ctx: Context, next: Function) => {
  ctx.res.statusCode = 200;
  try {
    await next();
  } catch (err) {
    console.error(err);
    throw err;
  }
});

app.use(async (ctx: Context) => {
  const step = config.path.find(({ slug }) => slug === ctx.query.step);
  console.log(step);
  return await ctx.render("step.pug", {
    markdownFile: `/${ctx.query.step}.md`,
    actions: step
      ? step.actions.reduce(
          (acc, { text, to }) => ({
            ...acc,
            [text]: `/${to}`
          }),
          {}
        )
      : {}
  });
});

export default app.callback();
