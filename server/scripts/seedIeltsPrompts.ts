// Script to insert 5 IELTS test sets into Prompt collection
import mongoose from 'mongoose';
import Prompt from '../src/models/Prompt';
import * as dotenv from 'dotenv';
dotenv.config();

const prompts = [
  {
    task_type: 'IELTS_Task1',
    text: 'The line graph below shows the number of tourists visiting a particular country from 1995 to 2010. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. (Assume a line graph showing fluctuations in tourist numbers over the years).',
    tags: ['line graph', 'tourism']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?',
    tags: ['education', 'community']
  },
  {
    task_type: 'IELTS_Task1',
    text: 'The table below shows the percentage of the population in three countries who used the Internet in the years 2005, 2010, and 2015. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. (Assume a table with data for 3 countries and 3 time points).',
    tags: ['table', 'internet']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'In many countries, traditional foods are being replaced by fast food. This is having a negative impact on families, individuals and society. To what extent do you agree or disagree?',
    tags: ['food', 'society']
  },
  {
    task_type: 'IELTS_Task1',
    text: 'The bar chart below shows the main reasons why people chose to live in the city in four different countries in 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. (Assume a bar chart comparing reasons like work, education, lifestyle, family for 4 countries).',
    tags: ['bar chart', 'city']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Some people think that governments should spend more money on public services, such as hospitals and schools, rather than on arts, such as music and painting. Discuss both views and give your own opinion.',
    tags: ['government', 'public services', 'arts']
  },
  {
    task_type: 'IELTS_Task1',
    text: 'The diagram below shows the process of producing chocolate. Summarise the information by selecting and reporting the main stages of the process. (Assume a process diagram illustrating the steps from cocoa bean to chocolate bar).',
    tags: ['process', 'chocolate']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Many young people today leave their rural hometowns to find work in cities. What are the reasons for this trend? What problems does this cause for rural communities?',
    tags: ['rural', 'urban', 'youth']
  },
  {
    task_type: 'IELTS_Task1',
    text: 'The pie charts below show the main sources of energy used in a country in 1990 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. (Assume two pie charts showing the percentages of coal, oil, natural gas, nuclear, and renewables in two different years).',
    tags: ['pie chart', 'energy']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Success is often measured by wealth and material possessions. Some people think this is a harmful trend for society. To what extent do you agree or disagree?',
    tags: ['success', 'society']
  }
];

async function insertPrompts() {
  await mongoose.connect(process.env.MONGO_URL || '');
  await Prompt.insertMany(prompts.map(p => ({ ...p, created_at: new Date() })));
  console.log('Inserted IELTS test sets successfully');
  await mongoose.disconnect();
}

insertPrompts();
