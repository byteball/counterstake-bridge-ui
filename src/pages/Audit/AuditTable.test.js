import ReactDOM from "react-dom";
import { Table } from "antd";
import { act } from "react-dom/test-utils";

import { DEFAULT_SORT, ExcessCell, filterRows, getColumns, matchesSearch, nextSort } from "./AuditTable";

const columns = getColumns({
  search: { value: '', onChange: () => {} },
  exportSide: { networks: ['Ethereum', 'Obyte'], value: undefined, onChange: () => {} },
  importSide: { networks: ['BSC', 'Obyte'], value: undefined, onChange: () => {} },
});
const byKey = (key) => columns.find(column => column.key === key);

const row = (home_symbol, ratio, lockedInUsd, networks = {}) => ({
  label: `${home_symbol}: ${networks.home_network || 'Ethereum'} → ${networks.foreign_network || 'Obyte'}`,
  bridge: { home_symbol, home_network: 'Ethereum', foreign_network: 'Obyte', ...networks },
  comparison: ratio === null ? null : { ratio },
  lockedInUsd,
});

describe('audit table columns', () => {
  it('puts the search box in place of the Bridge title and does not sort or filter there', () => {
    const bridge = byKey('bridge');

    expect(bridge.filters).toBeUndefined();
    expect(bridge.onFilter).toBeUndefined();
    expect(bridge.sorter).toBeUndefined();
    expect(bridge.title.props.value).toBe('');
  });

  it('offers each side its own network select instead of a filter menu', () => {
    const exportSide = byKey('export_side');
    const importSide = byKey('import_side');

    expect(exportSide.filters).toBeUndefined();
    expect(importSide.filters).toBeUndefined();

    expect(exportSide.title.props.placeholder).toBe('Export side');
    expect(exportSide.title.props.networks).toEqual(['Ethereum', 'Obyte']);
    expect(importSide.title.props.placeholder).toBe('Import side');
    expect(importSide.title.props.networks).toEqual(['BSC', 'Obyte']);
  });

  it('sorts the balances in one direction only', () => {
    expect(byKey('locked').sortDirections).toEqual(['descend']);
    expect(byKey('issued').sortDirections).toEqual(['descend']);
  });

  it('sorts the excess both ways, by excess relative to the issued amount', () => {
    const excess = byKey('excess');
    expect(excess.sortDirections).toEqual(['descend', 'ascend']);

    const deficit = row('ETH', -0.1);
    const thin = row('USDC', 0.01);
    const fat = row('WBTC', 2);

    expect([fat, deficit, thin].sort(excess.sorter)).toEqual([deficit, thin, fat]);
  });

  it('keeps rows with an unknown amount out of the way when sorting', () => {
    const known = row('ETH', 0.5, 100);
    const unknown = row('USDC', null, null);

    // descending puts them last in both columns
    expect([unknown, known].sort(byKey('excess').sorter).reverse()).toEqual([known, unknown]);
    expect([unknown, known].sort(byKey('locked').sorter).reverse()).toEqual([known, unknown]);
  });
});

describe('nextSort', () => {
  it('keeps the sorter the header reports', () => {
    expect(nextSort({ columnKey: 'excess', order: 'ascend' })).toEqual({ columnKey: 'excess', order: 'ascend' });
  });

  it('wraps to the column\'s first direction instead of switching the sort off', () => {
    // antd reports a cleared sorter with the column but no order
    expect(nextSort({ columnKey: 'excess', order: undefined })).toEqual({ columnKey: 'excess', order: 'descend' });
    expect(nextSort({ columnKey: 'locked', order: undefined })).toEqual(DEFAULT_SORT);
  });

  it('falls back to the default when no column is sorted at all', () => {
    expect(nextSort(undefined)).toBe(DEFAULT_SORT);
    expect(nextSort({})).toBe(DEFAULT_SORT);
  });
});

describe('sortOrder', () => {
  const orders = (sort) => getColumns({
    search: { value: '', onChange: () => {} },
    exportSide: { networks: [], value: undefined, onChange: () => {} },
    importSide: { networks: [], value: undefined, onChange: () => {} },
    sort,
  }).map(column => column.sortOrder);

  it('lights the arrow of the sorted column only', () => {
    expect(orders(DEFAULT_SORT)).toEqual([undefined, undefined, 'descend', undefined, null, null]);
    expect(orders({ columnKey: 'excess', order: 'ascend' })).toEqual([undefined, undefined, null, undefined, null, 'ascend']);
  });
});

describe('matchesSearch', () => {
  it('matches the token and either network, case- and space-insensitively', () => {
    const label = 'USDC: Ethereum → Obyte';

    expect(matchesSearch(label, 'usdc')).toBe(true);
    expect(matchesSearch(label, ' USDC ')).toBe(true);
    expect(matchesSearch(label, 'obyte')).toBe(true);
    expect(matchesSearch(label, 'ethereum → oby')).toBe(true);
    expect(matchesSearch(label, 'kava')).toBe(false);
  });

  it('keeps every row when the box is empty', () => {
    expect(matchesSearch('USDC: Ethereum → Obyte', '')).toBe(true);
    expect(matchesSearch('USDC: Ethereum → Obyte', '   ')).toBe(true);
    expect(matchesSearch('USDC: Ethereum → Obyte', undefined)).toBe(true);
  });
});

describe('filterRows', () => {
  const expatriation = row('USDC', 0, 0);
  const repatriation = row('OUSD', 0, 0, { home_network: 'Obyte', foreign_network: 'BSC' });
  const rows = [expatriation, repatriation];

  it('keeps every row when nothing is selected', () => {
    expect(filterRows(rows, { query: '' })).toEqual(rows);
    expect(filterRows(rows, { query: '', exportNetwork: undefined, importNetwork: undefined })).toEqual(rows);
  });

  it('filters each side by its own network', () => {
    expect(filterRows(rows, { exportNetwork: 'Ethereum' })).toEqual([expatriation]);
    expect(filterRows(rows, { exportNetwork: 'Obyte' })).toEqual([repatriation]);

    // the import side must not answer for the export side's network
    expect(filterRows(rows, { importNetwork: 'Obyte' })).toEqual([expatriation]);
    expect(filterRows(rows, { importNetwork: 'BSC' })).toEqual([repatriation]);
  });

  it('combines both selects', () => {
    expect(filterRows(rows, { exportNetwork: 'Ethereum', importNetwork: 'Obyte' })).toEqual([expatriation]);
    expect(filterRows(rows, { exportNetwork: 'Ethereum', importNetwork: 'BSC' })).toEqual([]);
  });

  it('combines the search box with a select', () => {
    expect(filterRows(rows, { query: 'usdc', exportNetwork: 'Ethereum' })).toEqual([expatriation]);
    expect(filterRows(rows, { query: 'usdc', exportNetwork: 'Obyte' })).toEqual([]);
  });
});

describe('ExcessCell', () => {
  const render = (props) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    act(() => { ReactDOM.render(<ExcessCell {...props} />, container); });
    return container;
  };

  it('colours a surplus green and a deficit red, since nothing else labels it', () => {
    const surplus = render({ comparison: { excess: '955000000', scale: 9, isDeficit: false, ratio: 0.3 }, symbol: 'ETH', usd: 2400 });
    expect(surplus.firstChild.firstChild.style.color).toBe('rgb(73, 170, 25)');
    expect(surplus.textContent).toContain('0.955');
    expect(surplus.textContent).toContain('$2,400');

    const deficit = render({ comparison: { excess: '-955000000', scale: 9, isDeficit: true, ratio: -0.3 }, symbol: 'ETH', usd: -2400 });
    expect(deficit.firstChild.firstChild.style.color).toBe('rgb(211, 32, 41)');
    expect(deficit.textContent).toContain('-0.955');
  });

  it('shows n/a for the USD value when the price is unknown, not $0', () => {
    expect(render({ comparison: { excess: '0', scale: 9, isDeficit: false, ratio: 0 }, symbol: 'ETH', usd: null }).textContent).toContain('n/a');
  });

  it('shows a skeleton while one of the two amounts is still loading, a dash once it failed', () => {
    expect(render({ comparison: null, symbol: 'ETH', usd: null, pending: true }).querySelector('.ant-skeleton')).not.toBe(null);
    expect(render({ comparison: null, symbol: 'ETH', usd: null, pending: false }).textContent).toBe('—');
  });
});

describe('renderTotals', () => {
  const { renderTotals } = require("./AuditTable");

  beforeAll(() => {
    window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener: () => {}, removeListener: () => {} }));
  });
  const done = { status: 'succeeded', value: '1' };
  const loading = { status: 'loading', value: null };
  const fields = (status = done) => ({ locked: status, issued: status, homeRate: status, foreignRate: status });
  const priced = (label, lockedInUsd, issuedInUsd, excessInUsd) => ({ label, isPriced: true, lockedInUsd, issuedInUsd, excessInUsd, ...fields() });

  // Table.Summary must live inside an antd Table, so render the row's cells through it
  const renderIn = (rows) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      ReactDOM.render(
        <Table columns={[{ key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'd' }, { key: 'e' }, { key: 'f' }]} dataSource={[]} pagination={false} summary={() => renderTotals(rows)} />,
        container
      );
    });
    return container.querySelector('.ant-table-summary');
  };

  it('totals only what is passed to it, so a filtered table gets a filtered total', () => {
    const summary = renderIn([priced('USDC', 100, 60, 35), priced('WBTC', 50, 70, -15)]);
    const cells = [...summary.querySelectorAll('td')].map(td => td.textContent.trim());

    expect(cells[0]).toContain('Total');
    expect(cells[0]).toContain('2 bridges');
    expect(cells[2]).toBe('$150');
    expect(cells[4]).toBe('$130');
    expect(cells[5]).toBe('$20');
  });

  it('paints a negative excess red and says how many rows had a price', () => {
    const summary = renderIn([priced('USDC', 50, 70, -20), { label: 'X', isPriced: false, ...fields() }]);
    const cells = [...summary.querySelectorAll('td')];

    expect(cells[0].textContent).toContain('1 of 2 priced');
    expect(cells[5].textContent.trim()).toBe('-$20');
    expect(cells[5].querySelector('span').style.color).toBe('rgb(211, 32, 41)');
  });

  it('shows n/a rather than $0 when nothing shown has a price', () => {
    const summary = renderIn([{ label: 'X', isPriced: false, ...fields() }]);
    const cells = [...summary.querySelectorAll('td')].map(td => td.textContent.trim());
    expect(cells[2]).toBe('n/a');
    expect(cells[5]).toBe('n/a');
  });

  it('shows skeletons while nothing shown has answered yet', () => {
    const summary = renderIn([{ label: 'X', isPriced: false, ...fields(loading) }]);
    expect(summary.querySelectorAll('.ant-skeleton').length).toBe(3);
    expect(summary.textContent).toContain('0 of 1 in so far');
    expect(summary.querySelector('.anticon-loading')).not.toBe(null);
  });

  it('dims a partial total and says how many rows are still on their way', () => {
    const summary = renderIn([priced('USDC', 100, 60, 35), { label: 'ETH', isPriced: false, ...fields(loading) }]);
    const cells = [...summary.querySelectorAll('td')];

    expect(cells[2].textContent.trim()).toBe('$100');
    expect(cells[2].querySelector('span').style.opacity).toBe('0.6');
    expect(cells[0].textContent).toContain('1 of 2 in so far');
    expect(summary.querySelector('.anticon-loading')).not.toBe(null);
    expect(summary.querySelector('.ant-skeleton')).toBe(null);
  });
});
