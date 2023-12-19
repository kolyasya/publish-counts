/// <reference path="./types.d.ts" />

let noWarnings = false;

Counts = {};

/** @type {CountsPublish} */
Counts.publish = function (self, name, cursor, options) {
  var initializing = true;
  var handle;
  var pullingHandle;
  var extraField, countFn;

  options = options || {};

  if (options.countFromField) {
    extraField = options.countFromField;

    if (typeof extraField === 'function') {
      countFn = Counts._safeAccessorFunction(extraField);
    } else {
      countFn = function (doc) {
        return doc[extraField] || 0; // return 0 instead of undefined.
      };
    }
  } else if (options.countFromFieldLength) {
    extraField = options.countFromFieldLength;

    if (typeof extraField === 'function') {
      countFn = Counts._safeAccessorFunction(function (doc) {
        return extraField(doc).length;
      });
    } else {
      countFn = function (doc) {
        if (doc[extraField]) {
          return doc[extraField].length;
        } else {
          return 0;
        }
      };
    }
  }

  // if (countFn && options.nonReactive)
  // throw new Error("options.nonReactive is not yet supported with options.countFromFieldLength or options.countFromFieldSum");

  if (cursor?._cursorDescription) {
    cursor._cursorDescription.options.fields = Counts._optimizeQueryFields(
      cursor._cursorDescription.options.fields ||
        cursor._cursorDescription.options.projection,
      extraField,
      options.noWarnings
    );
  }

  if (!options.pullingInterval) {
    var count = 0;
    var observers = {
      added: function (doc) {
        if (countFn) {
          count += countFn(doc);
        } else {
          count += 1;
        }

        if (!initializing) self.changed('counts', name, { count: count });
      },
      removed: function (doc) {
        if (countFn) {
          count -= countFn(doc);
        } else {
          count -= 1;
        }
        self.changed('counts', name, { count: count });
      },
    };

    if (countFn) {
      observers.changed = function (newDoc, oldDoc) {
        if (countFn) {
          count += countFn(newDoc) - countFn(oldDoc);
        }

        self.changed('counts', name, { count: count });
      };
    }

    if (!countFn) {
      self.added('counts', name, { count: cursor.count() });
      if (!options.noReady) self.ready();
    }

    if (!options.nonReactive) handle = cursor.observe(observers);

    if (countFn) {
      if (options.nonReactive) {
        count =
          cursor
            .fetch()
            .reduce((previous, doc) => previous + countFn(doc), 0) || 0;
      }

      self.added('counts', name, { count: count });
    }
  } else {
    self.added('counts', name, { count: cursor.count() });

    pullingHandle = Meteor.setInterval(function () {
      self.changed('counts', name, { count: cursor.count() });
    }, options.pullingInterval);
  }

  if (!options.noReady) self.ready();

  initializing = false;

  self.onStop(function () {
    if (handle) handle.stop();

    // console.log("publish count onStop, clearing interval", pullingHandle);
    if (pullingHandle) Meteor.clearInterval(pullingHandle);
  });

  return {
    stop: function () {
      if (handle) {
        handle.stop();
        handle = undefined;
      }

      if (pullingHandle) {
        // console.log("publish count stop, clearing interval", pullingHandle);
        Meteor.clearInterval(pullingHandle);
        pullingHandle = undefined;
      }
    },
  };
};
// back compatibility
publishCount = Counts.publish;

/**
 * Suppress warnings from the source code
 */
Counts.noWarnings = function (noWarn = true) {
  noWarnings = !!noWarn;
};

/**
 * Ensure that missing fields don't corrupt the count.  
 * If the count field doesn't exist → return 0 as a result
 * 
 * @type {CountsSafeAccessorFunction}
 */
Counts._safeAccessorFunction = function safeAccessorFunction(fn) {
  return function (doc) {
    try {
      return fn(doc) || 0; // return 0 instead of undefined
    } catch (err) {
      if (err instanceof TypeError) {
        // attempted to access property of undefined (i.e. deep access).
        return 0;
      } else {
        throw err;
      }
    }
  };
};

/**
 * Checks which fields user is going to use to calculate counts
 * And warns if something is wrong with the fields set
 * @type {CountsptimizeQueryFields}
 */
Counts._optimizeQueryFields = function optimizeQueryFields(
  fields,
  extraField,
  noWarn
) {
  switch (typeof extraField) {
    // accessor function used
    case 'function': {
      // If user did not place restrictions on cursor fields we can only warn him about that
      if (fields === undefined) {
        Counts._warn(
          noWarn,
          `publish-counts: Collection cursor has no field limits and will fetch entire documents. ` +
            `Consider specifying only required fields`
        );
      }

      // We can't make sure that user included proper fields here for the accessor function
      // So use fields as is
      // _id field will be included by Meteor anyway
      return fields;
    }

    // countFromField or countFromFieldLength has property name
    case 'string': {
      // Make sure that required fields are included in the set
      // Don't pull other fields since user may use a cursor transform
      // and specify a dynamic field to count, but require other fields in the transform process
      // (e.g. https://github.com/percolatestudio/publish-counts/issues/47).
      fields = fields || {};

      // _id and extraField are required anyway
      fields._id = true;
      fields[extraField] = true;

      if (2 < Object.keys(fields).length) {
        Counts._warn(
          noWarn,
          'publish-counts: unused fields detected in cursor fields option',
          _.omit(fields, ['_id', extraField]) // Gets all other field names
        );
      }

      // use modified field limits.  automatically defaults to _id and extraField if none specified by user.
      return fields;
    }

    // In this case we make sure that only _id field is included in the set
    case 'undefined': {
      const unusedFields = _.omit(fields || {}, ['_id']);

      // basic count
      if (Object.keys(unusedFields).length > 0)
        Counts._warn(
          noWarn,
          'publish-counts: unused fields removed from cursor fields option.',
          unusedFields
        );

      fields = { _id: true };

      return fields;
    }

    default:
      throw new Error('unknown invocation of Count.publish() detected.');
  }
};

Counts._warn = function warn(noWarn) {
  if (noWarnings || noWarn || 'production' == process.env.NODE_ENV) return;

  var args = Array.prototype.slice.call(arguments, 1);
  console.warn.apply(console, args);
};
