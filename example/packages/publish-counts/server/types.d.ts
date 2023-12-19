type CountsPublish = (
  self: Meteor.Subscription,
  name: string,
  cursor: Mongo.Cursor,
  options: {
    countFromField?: string | ((doc) => number);
    countFromFieldLength: string | ((doc) => number);
    nonReactive?: boolean;
    noReady?: boolean;
    noWarnings?: boolean;
    pullingInterval?: number;
  }
) => {};

type CountsNoWarnings = (noWarn?: boolean) => {};

type CountsptimizeQueryFields = (
  fields?: object,
  extraField: string | ((doc) => number),
  noWarn?: boolean
) => {};

type CountsSafeAccessorFunction = (fn: () => {}) => number;
