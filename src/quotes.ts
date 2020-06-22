import axios from 'axios'
import * as _ from 'lodash';    

const baseUrl = 'https://favqs.com/api/';
const headers = {
  Authorization: process.env.quoteAuth
};

export interface Quote {
  body: string;
  author: string;
}


export function quoteOfTheDay(): Promise<Quote> {
  return new Promise((resolve, reject) => {

    axios({
      url: '/qotd.json',
      baseURL: baseUrl,
      headers: headers
    })
      .then(response => {
        if (response.data.quotes && _.isArray(response.data.quotes)) {
          let result = _.sample(response.data.quotes);
          return resolve(result);
        }

        return resolve(response.data);
      })
      .catch(err => reject(err));
  });
};