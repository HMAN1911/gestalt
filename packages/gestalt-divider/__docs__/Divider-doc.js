import React from 'react';
import Divider from '../Divider';
import { card, md, ns } from 'corkboard';

ns('Divider');

card('Divider usage',
  md`If you have two things that need to be separated, put a \`Divider\` between them.`,
  <div>
    <div className="p1">{'Some content'}</div>
    <Divider />
    <div className="p1">{'Other content'}</div>
  </div>);