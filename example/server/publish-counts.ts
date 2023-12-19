import { Meteor } from 'meteor/meteor';
import { Counts } from 'meteor/kolyasya:publish-counts';

import { LinksCollection } from '/imports/api/links';

Meteor.publish('link', function () {
  Counts.publish(this, 'linksCount', LinksCollection.find(), { noReady: true });

  return LinksCollection.find({}, { limit: 1 });
});
