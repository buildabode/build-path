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
  start: string;
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
  const slug = ctx.query.step || config.start;
  const step = config.path.find(node => node.slug === slug);
  return await ctx.render("step.pug", {
    markdownFile: `/${slug}.md`,
    actions: step
      ? step.actions.reduce(
          (acc, { text, to }) => ({
            ...acc,
            [text]: `/${to}`
          }),
          {}
        )
      : undefined
  });
});

export default app.callback();
