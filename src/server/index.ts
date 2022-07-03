import http from 'http';
import ContentRegistry from './contentRegistry';

enum Urls {
  'getBySlug' = '/getBySlug',
  'getAll' = '/getAll',
  'getAllSamples' = '/getAllSamples',
  'getInternalDestinations' = '/getInternalDestinations',
}

const PORT = 3010;
enum Status {
  ok = 200,
  methodNotAllowed = 405,
  badRequest = 400,
  notFound = 404,
}
const GET_METHOD = 'GET';
const api = `
WebDoky content server.

Supports two types of requests:
<pre>/getBySlug?query=%yourSlug%</pre> — retrieves a page by it's slug
<pre>/getAll?fields=%your,comma,separated,optionsl,fields%</pre> — retrieves all pages. If fields parameter is specified - then it only selects specified fields.
<pre>/getAllSamples</pre> — retrieves all live samples.
<pre>/getInternalDestinations</pre> — retrieves all possible working links.
`;
const wrapMessage = (message) =>
  JSON.stringify({
    message,
  });

const wrapData = (data) =>
  JSON.stringify({
    data,
  });

const createHttpRequestProcessor = (contentRegistry: ContentRegistry) => {
  return (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const { method } = req;
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}/`);
    const { searchParams, pathname } = parsedUrl;

    if (method === GET_METHOD) {
      if (pathname === Urls.getAll) {
        res.writeHead(Status.ok);
        const fields = searchParams.get('fields');
        if (fields) {
          const arrayOfFields = fields.split(',');
          res.end(
            wrapData(
              contentRegistry.getAll().map((pageEntry) => {
                const result = {};
                arrayOfFields.forEach((key) => {
                  result[key] = pageEntry[key];
                });
                return result;
              }),
            ),
          );
        } else {
          res.end(wrapData(contentRegistry.getAll()));
        }
      } else if (pathname === Urls.getBySlug) {
        const searchTerm = searchParams.get('query');
        if (!searchTerm) {
          res.writeHead(Status.badRequest);
          res.end('Missing required parameter: query');
        } else {
          const pageEntry = contentRegistry.getBySlug(
            searchParams.get('query'),
          );
          if (!pageEntry) {
            res.writeHead(Status.notFound);
            res.end('Page with this query does not exist: query');
          } else {
            res.writeHead(Status.ok);
            res.end(wrapData(pageEntry));
          }
        }
      } else if (pathname === Urls.getAllSamples) {
        res.writeHead(Status.ok);
        res.end(wrapData(contentRegistry.getLiveSamples()));
      } else if (pathname === Urls.getInternalDestinations) {
        res.writeHead(Status.ok);
        res.end(wrapData(contentRegistry.getInternalDestinations()));
      } else {
        // Default route, just return help text
        res.writeHead(Status.ok);
        res.end(wrapMessage(api));
      }
    } else {
      res.writeHead(Status.methodNotAllowed);
      res.end(wrapMessage(api));
    }
  };
};

interface ServerOptions {
  pathToLocalizedContent: string;
  pathToOriginalContent: string;
  sourceLocale: string;
  targetLocale: string;
}

const runServer = async (options: ServerOptions) => {
  console.info(`Starting content registry initialization...`);
  const contentRegistry = new ContentRegistry();
  await contentRegistry.init(options);

  console.info(`Content registry initalization complete`);

  http
    .createServer({}, createHttpRequestProcessor(contentRegistry))
    .listen(PORT);

  console.info(`Content server is listening on port ${PORT}`);
};

export default runServer;
