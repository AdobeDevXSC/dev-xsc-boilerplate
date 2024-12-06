/* eslint-disable import/prefer-default-export */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-continue */
/* eslint-disable consistent-return */
/* eslint-disable max-len */
/* eslint-disable no-fallthrough */
/* eslint-disable default-case */
/* eslint-disable no-plusplus */
/* eslint-disable no-bitwise */
/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

let storage = window.sessionStorage;

// eslint-disable-next-line camelcase
function murmurhash3_32_gc(key, seed) {
  const remainder = key.length & 3;
  const bytes = key.length - remainder;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  let h1 = seed;
  let k1;
  let h1b;
  let i = 0;
  while (i < bytes) {
    k1 = ((key.charCodeAt(i) & 0xff))
              | ((key.charCodeAt(++i) & 0xff) << 8)
              | ((key.charCodeAt(++i) & 0xff) << 16)
              | ((key.charCodeAt(++i) & 0xff) << 24);
    ++i;
    k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;
    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
    h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
  }
  k1 = 0;
  switch (remainder) {
    case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
    case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
    case 1:
      k1 ^= (key.charCodeAt(i) & 0xff);
      k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
      h1 ^= k1;
  }
  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
  h1 ^= h1 >>> 13;
  h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
  h1 ^= h1 >>> 16;
  return h1 >>> 0;
}

const TOTAL_BUCKETS = 10000;
function getBucket(saltedId) {
  const hash = murmurhash3_32_gc(saltedId, 0);
  const hashFixedBucket = Math.abs(hash) % TOTAL_BUCKETS;
  const bucket = hashFixedBucket / TOTAL_BUCKETS;
  return bucket;
}
function pickWithWeightsBucket(allocationPercentages, treatments, bucket) {
  const sum = allocationPercentages.reduce((partialSum, a) => partialSum + a, 0);
  let partialSum = 0.0;
  for (let i = 0; i < treatments.length; i++) {
    partialSum += Number(allocationPercentages[i].toFixed(2)) / sum;
    if (bucket > partialSum) {
      continue;
    }
    return treatments[i];
  }
}
function assignTreatmentByVisitor(experimentid, identityId, allocationPercentages, treatments) {
  const saltedId = `${experimentid}.${identityId}`;
  const bucketId = getBucket(saltedId);
  const treatmentId = pickWithWeightsBucket(allocationPercentages, treatments, bucketId);
  return {
    treatmentId,
    bucketId,
  };
}

const LOCAL_STORAGE_KEY = 'unified-decisioning-experiments';
function assignTreatment(allocationPercentages, treatments) {
  let random = Math.random() * 100;
  let i = treatments.length;
  while (random > 0 && i > 0) {
    i -= 1;
    random -= +allocationPercentages[i];
  }
  return treatments[i];
}
function getLastExperimentTreatment(experimentId) {
  const experimentsStr = storage.getItem(LOCAL_STORAGE_KEY);
  if (experimentsStr) {
    const experiments = JSON.parse(experimentsStr);
    if (experiments[experimentId]) {
      return experiments[experimentId].treatment;
    }
  }
  return null;
}
function setLastExperimentTreatment(experimentId, treatment) {
  const experimentsStr = storage.getItem(LOCAL_STORAGE_KEY);
  const experiments = experimentsStr ? JSON.parse(experimentsStr) : {};
  const now = new Date();
  const expKeys = Object.keys(experiments);
  expKeys.forEach((key) => {
    const date = new Date(experiments[key].date);
    if ((now.getTime() - date.getTime()) > (1000 * 86400 * 30)) {
      delete experiments[key];
    }
  });
  const date = now.toISOString().split('T')[0];
  experiments[experimentId] = { treatment, date };
  storage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(experiments));
}
function assignTreatmentByDevice(experimentId, allocationPercentages, treatments) {
  const cachedTreatmentId = getLastExperimentTreatment(experimentId);
  let treatmentIdResponse;
  if (!cachedTreatmentId || !treatments.includes(cachedTreatmentId)) {
    const assignedTreatmentId = assignTreatment(allocationPercentages, treatments);
    setLastExperimentTreatment(experimentId, assignedTreatmentId);
    treatmentIdResponse = assignedTreatmentId;
  } else {
    treatmentIdResponse = cachedTreatmentId;
  }
  return {
    treatmentId: treatmentIdResponse,
  };
}

const RandomizationUnit = {
  VISITOR: 'VISITOR',
  DEVICE: 'DEVICE',
};
function evaluateExperiment(context, experiment) {
  const experimentId = experiment.id; const { identityNamespace } = experiment; const _a = experiment.randomizationUnit; const
    // eslint-disable-next-line no-void
    randomizationUnit = _a === void 0 ? RandomizationUnit.VISITOR : _a;
  const { identityMap } = context;
  const treatments = experiment.treatments.map((item) => item.id);
  const allocationPercentages = experiment.treatments.map((item) => item.allocationPercentage);
  let treatmentAssignment = null;
  switch (randomizationUnit) {
    case RandomizationUnit.VISITOR: {
      const identityId = identityMap[identityNamespace][0].id;
      treatmentAssignment = assignTreatmentByVisitor(experimentId, identityId, allocationPercentages, treatments);
      break;
    }
    case RandomizationUnit.DEVICE: {
      treatmentAssignment = assignTreatmentByDevice(experimentId, allocationPercentages, treatments);
      break;
    }
    default:
      throw new Error('Unknow randomization unit');
  }
  const evaluationResponse = {
    experimentId,
    hashedBucket: treatmentAssignment.bucketId,
    treatment: {
      id: treatmentAssignment.treatmentId,
    },
  };
  return evaluationResponse;
}

function traverseDecisionTree(decisionNodesMap, context, currentNodeId) {
  const _a = decisionNodesMap[currentNodeId]; const { experiment } = _a; const
    { type } = _a;
  if (type === 'EXPERIMENTATION') {
    const { treatment } = evaluateExperiment(context, experiment);
    return [treatment];
  }
}
function evaluateDecisionPolicy(decisionPolicy, context) {
  if (context.storage && context.storage instanceof Storage) {
    storage = context.storage;
  }
  const decisionNodesMap = {};
  decisionPolicy.decisionNodes.forEach((item) => {
    decisionNodesMap[item.id] = item;
  });
  const items = traverseDecisionTree(decisionNodesMap, context, decisionPolicy.rootDecisionNodeId);
  return {
    items,
  };
}

export const ued = { evaluateDecisionPolicy };
