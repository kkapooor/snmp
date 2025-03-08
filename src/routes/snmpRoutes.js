const express = require('express');
const router = express.Router();
const snmp = require('net-snmp');

// SNMP GET request
router.post('/get', async (req, res) => {
  const { host, community, oids } = req.body;

  const session = snmp.createSession(host, community);
  
  session.get(oids, (error, varbinds) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.toString() });
    }

    const results = varbinds.map(varbind => ({
      oid: varbind.oid,
      value: varbind.value.toString()
    }));

    res.json(results);
  });
});

// SNMP WALK request
router.post('/walk', async (req, res) => {
  const { host, community, oid } = req.body;

  const session = snmp.createSession(host, community);
  const results = [];

  function doneCb(error) {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.toString() });
    }
    res.json(results);
  }

  function feedCb(varbinds) {
    for (const varbind of varbinds) {
      if (snmp.isVarbindError(varbind)) {
        console.error(snmp.varbindError(varbind));
      } else {
        results.push({
          oid: varbind.oid,
          value: varbind.value.toString()
        });
      }
    }
  }

  session.walk(oid, feedCb, doneCb);
});

module.exports = router;
