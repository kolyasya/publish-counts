import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

// If the package was imported twice (in another package, for example)
// We need to check that such collection already exists
const localCollections = Meteor.connection._mongo_livedata_collections || {};

const existingCountsCollection = Object.values(localCollections).find(
  (collection) => collection?.name === 'counts'
);

if (existingCountsCollection) {
  console.warn(
    `Publish Counts | Collection named "counts" already exists on a client`
  );
  return;
}

// Create a client-side collection
Counts = new Mongo.Collection('counts');

Counts.get = function countsGet(name) {
  var count = this.findOne(name);
  return (count && count.count) || 0;
};

Counts.has = function countsHas(name) {
  return !!this.findOne(name);
};

if (Package.templating) {
  Package.templating.Template.registerHelper(
    'getPublishedCount',
    function (name) {
      return Counts.get(name);
    }
  );

  Package.templating.Template.registerHelper(
    'hasPublishedCount',
    function (name) {
      return Counts.has(name);
    }
  );
}
