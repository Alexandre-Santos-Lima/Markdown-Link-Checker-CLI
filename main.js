const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

function extractLinks(text) {
  const regex = /\[[^\]]+\]\((https?:\/\/[^\s\)]+)\)/g;
  const links = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    links.push(match[1]);
  }
  return [...new Set(links)];
}

async function checkLink(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'MarkdownLinkChecker/1.0' }
    });
    return {
      url: url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    };
  } catch (error) {
    return {
      url: url,
      status: 0,
      statusText: error.code || 'Network Error',
      ok: false
    };
  }
}

function displayResults(results) {
  console.log('\n--- Resultados da Verificação ---');
  let goodLinks = 0;
  let brokenLinks = 0;

  results.forEach(result => {
    if (result.ok) {
      console.log(`${chalk.green('[OK]')} ${chalk.dim(`(${result.status})`)} - ${result.url}`);
      goodLinks++;
    } else {
      console.log(`${chalk.red('[BROKEN]')} ${chalk.yellow(`(${result.status} ${result.statusText})`)} - ${result.url}`);
      brokenLinks++;
    }
  });

  console.log('\n--- Resumo ---');
  console.log(chalk.green(`Links funcionando: ${goodLinks}`));
  console.log(chalk.red(`Links quebrados: ${brokenLinks}`));
  console.log(`Total de links únicos verificados: ${results.length}`);
}

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error(chalk.red('Erro: Forneça o caminho para um arquivo Markdown.'));
    console.log(chalk.yellow('Uso: node main.js <caminho_para_o_arquivo.md>'));
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);

  try {
    console.log(chalk.blue(`Lendo o arquivo: ${absolutePath}`));
    const content = await fs.readFile(absolutePath, 'utf-8');

    const links = extractLinks(content);
    if (links.length === 0) {
      console.log(chalk.green('Nenhum link encontrado no arquivo.'));
      return;
    }

    console.log(chalk.blue(`Encontrados ${links.length} links únicos. Iniciando verificação...`));

    const checkPromises = links.map(checkLink);
    const results = await Promise.all(checkPromises);

    displayResults(results);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(chalk.red(`Erro: O arquivo não foi encontrado em '${absolutePath}'`));
    } else {
      console.error(chalk.red('Ocorreu um erro inesperado:'), error);
    }
    process.exit(1);
  }
}

main();