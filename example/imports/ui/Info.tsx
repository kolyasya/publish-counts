import React from 'react';
import { useFind, useSubscribe, useTracker } from 'meteor/react-meteor-data';
import { Counts } from 'meteor/kolyasya:publish-counts';
import { LinksCollection, Link } from '../api/links';

export const Info = () => {
  const isLoading = useSubscribe('link');
  const links = useFind(() => LinksCollection.find());

  const { linksCount } = useTracker(() => {
    return {
      linksCount: Counts.get('linksCount')
    }
  });

  if (isLoading()) {
    return <div>Loading...</div>;
  }

  const makeLink = (link: Link) => {
    return (
      <li key={link._id}>
        <a href={link.url} target="_blank">
          {link.title}
        </a>
      </li>
    );
  };

  return (
    <div>
      <h2>Link:</h2>
      <ul>{links.map(makeLink)}</ul>
      <h2>Total links:</h2>
      <p>{linksCount}</p>
    </div>
  );
};
