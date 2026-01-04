// async function getFeed(req, res) {
//   const seed = Number(req.query.seed || 0);
//   const cursor = Number(req.query.cursor || 0);
//   const limit = 50;
//   const mode = req.query.mode || 'home';

//   // TEMP: reuse trending logic
//   const data = await getAllTrendingInternal(seed);

//   const batch = data.slice(cursor, cursor + limit);

//   res.json({
//     success: true,
//     data: batch,
//     nextCursor: cursor + batch.length
//   });
// }
