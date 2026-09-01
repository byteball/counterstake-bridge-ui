import { useState } from "react";
import { Input, Select, Skeleton, Table } from "antd";
import { LoadingOutlined, SearchOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";

import { InfoTooltip } from "components/InfoTooltip/InfoTooltip";
import { getExplorerLink } from "utils/getExplorerLink";
import { formatUsd } from "utils/formatAmount";
import { getObyteAssetUrl } from "utils/getObyteAssetSupply";

import { Amount, AmountCell, AmountSkeleton } from "./AmountCell";
import { selectAuditTableRows, sumRows } from "./helpers/selectAuditTableRows";

// The colour carries the verdict here, so it has to be readable on the dark background —
// hence antd's dark-theme success/error rather than the darker #3f8600 used on the
// assistants page, where the colour is only a hint next to a labelled number.
const SURPLUS_COLOR = '#49aa19';
const DEFICIT_COLOR = '#d32029';

// Which columns sort and how — the balances only largest-first, since the smallest bridge is
// nobody's question; the excess also ascending, to bring the thinnest cover to the top.
const SORT_DIRECTIONS = {
  locked: ['descend'],
  issued: ['descend'],
  excess: ['descend', 'ascend'],
};

// The table opens on a real column sort rather than on the rows' own order, so the highlighted
// arrow in the header says how it is ranked before anything is read.
export const DEFAULT_SORT = { columnKey: 'locked', order: 'descend' };

// A sort can't be switched off, only moved to another column: where antd would clear the sorter
// — the click after the last of the column's directions — it wraps back to the first one, so the
// table is never left in an order no arrow points at.
export const nextSort = ({ columnKey, order } = {}) => {
  const directions = SORT_DIRECTIONS[columnKey];
  return directions ? { columnKey, order: order || directions[0] } : DEFAULT_SORT;
}

// Sorting is controlled, so that the arrow can't disagree with the order the rows are in. Both
// props hang off the column's key, so they are attached by key instead of being repeated — and
// mistyped — in three definitions.
const withSortState = (sort) => (column) => (SORT_DIRECTIONS[column.key] ? {
  ...column,
  sortDirections: SORT_DIRECTIONS[column.key],
  sortOrder: (sort.columnKey === column.key && sort.order) || null,
} : column);

// Amounts are in different assets, so rows are ranked by their USD value; rows without a
// price sink to the bottom, which is where a descending-only sort wants them anyway.
const byNumber = (field) => (a, b) => (a[field] ?? -Infinity) - (b[field] ?? -Infinity);

const byExcessRatio = (a, b) => (a.comparison?.ratio ?? -Infinity) - (b.comparison?.ratio ?? -Infinity);

// The label carries the token and both networks, so one plain substring search covers
// "usdc", "kava" and "obyte →" alike.
export const matchesSearch = (label, query) => {
  const needle = String(query || '').trim().toLowerCase();
  return !needle || String(label || '').toLowerCase().includes(needle);
}

/**
 * The three header controls filter together: text over the whole label, and a network per side.
 * No selection means "any", so clearing a select is enough to see everything again.
 */
export const filterRows = (rows, { query, exportNetwork, importNetwork }) => rows.filter(({ label, bridge }) => (
  matchesSearch(label, query)
  && (!exportNetwork || bridge.home_network === exportNetwork)
  && (!importNetwork || bridge.foreign_network === importNetwork)
));

// The controls sit in the header in place of the titles: one click to pick a network, or type
// to search, instead of opening antd's filter menu and confirming it.
const SearchBox = ({ value, onChange }) => (
  <Input
    allowClear
    size="small"
    placeholder="Search bridges"
    prefix={<SearchOutlined style={{ opacity: .45 }} />}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onClick={(e) => e.stopPropagation()}
  />
);

const NetworkSelect = ({ placeholder, networks, value, onChange }) => (
  <Select
    allowClear
    showSearch={false}
    size="small"
    dropdownMatchSelectWidth={false}
    placeholder={placeholder}
    style={{ width: '100%' }}
    value={value}
    options={networks.map(network => ({ label: network, value: network }))}
    onChange={onChange}
    onClick={(e) => e.stopPropagation()}
  />
);

const SideCell = ({ network, address, type = 'address' }) => (
  <div>
    <div>{network}</div>
    <a className="evmHashOrAddress" style={{ fontSize: 12 }} href={getExplorerLink(network, address, type)} target="_blank" rel="noopener noreferrer">
      {address.slice(0, 6)}…{address.slice(-4)}
    </a>
  </div>
);

export const ExcessCell = ({ comparison, symbol, usd, pending }) => {
  if (comparison)
    return <Amount raw={comparison.excess} decimals={comparison.scale} symbol={symbol} usd={usd} color={comparison.isDeficit ? DEFICIT_COLOR : SURPLUS_COLOR} />;
  // no comparison yet: either one of the two amounts is still on its way, or it failed for good
  return pending ? <AmountSkeleton /> : <span style={{ opacity: .7 }}>—</span>;
}

/**
 * @param search     { value, onChange } for the bridge search box
 * @param exportSide { networks, value, onChange } for the export-side network select
 * @param importSide { networks, value, onChange } for the import-side network select
 * @param sort       { columnKey, order } of the active column sort, DEFAULT_SORT unless given
 */
export const getColumns = ({ search, exportSide, importSide, sort = DEFAULT_SORT }) => [
  {
    title: <SearchBox {...search} />,
    key: 'bridge',
    width: 210,
    render: (_value, { label }) => label,
  },
  {
    title: <NetworkSelect placeholder="Export side" {...exportSide} />,
    key: 'export_side',
    width: 160,
    render: (_value, { bridge }) => <SideCell network={bridge.home_network} address={bridge.export_aa} />,
  },
  {
    title: <span>Export balance <InfoTooltip title="The raw balance held on the export side. It also covers the stakes of ongoing and of finished but not yet withdrawn claims, and anything sent there directly." /></span>,
    key: 'locked',
    width: 190,
    sorter: byNumber('lockedInUsd'),
    render: (_value, { bridge, locked, lockedInUsd }) => (
      <AmountCell field={locked} decimals={bridge.home_asset_decimals} symbol={bridge.home_symbol} usd={lockedInUsd} />
    ),
  },
  {
    title: <NetworkSelect placeholder="Import side" {...importSide} />,
    key: 'import_side',
    width: 160,
    render: (_value, { bridge }) => (
      // on EVM the import contract is the image token itself, and its token page shows the very
      // supply this row reports — the quickest way to check the number by hand
      <SideCell
        network={bridge.foreign_network}
        address={bridge.import_aa}
        type={bridge.foreign_network === 'Obyte' ? 'address' : 'token'}
      />
    ),
  },
  {
    title: <span>Issued <InfoTooltip title="The image tokens held by users on the import side: totalSupply() on EVM, and the asset supply excluding the issuing AA on Obyte." /></span>,
    key: 'issued',
    width: 190,
    sorter: byNumber('issuedInUsd'),
    render: (_value, { bridge, issued, issuedInUsd }) => (
      <AmountCell
        field={issued}
        decimals={bridge.foreign_asset_decimals}
        symbol={bridge.foreign_symbol}
        usd={issuedInUsd}
        fallbackUrl={bridge.foreign_network === 'Obyte' ? getObyteAssetUrl(bridge.foreign_asset) : undefined}
      />
    ),
  },
  {
    title: <span>Excess / Deficit <InfoTooltip title="Export balance minus the issued amount. Green is a surplus, which is normal — the export balance also covers the stakes of open claims. Red means more is issued than held, which is worth investigating. Sorted by the excess relative to the issued amount, so bridges holding different assets can be compared; sort ascending to bring the thinnest cover to the top." /></span>,
    key: 'excess',
    width: 180,
    sorter: byExcessRatio,
    render: (_value, { comparison, bridge, excessInUsd, locked, issued }) => (
      <ExcessCell
        comparison={comparison}
        symbol={bridge.home_symbol}
        usd={excessInUsd}
        pending={[locked, issued].some(f => f.status === 'idle' || f.status === 'loading')}
      />
    ),
  },
].map(withSortState(sort));

const uniqueSorted = (values) => [...new Set(values.filter(Boolean))].sort();

// Same three states as the summary cards: a skeleton while there is nothing to sum, a dimmed
// number while rows are still arriving, the plain figure once every shown row has answered.
const TotalCell = ({ value, pending, settling }) => {
  if (pending) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: 22 }}>
      <Skeleton.Input active size="small" style={{ width: 80, height: 14 }} />
    </span>
  );
  if (value === null) return <span style={{ opacity: .7 }}>n/a</span>;
  return (
    <span style={{ color: value < 0 ? DEFICIT_COLOR : undefined, opacity: settling ? .6 : 1 }}>
      {formatUsd(value)}
    </span>
  );
}

const isUnsettled = (field) => field.status === 'idle' || field.status === 'loading';

// Totals of the rows currently shown — antd passes the filtered data, so the search box and the
// network selects narrow the total along with the table. Amounts are in different assets, so
// the only total that makes sense is in USD; a red excess means the shown bridges issued more
// than they hold. A row still waiting on any of its sources counts as "still loading" here,
// because until it answers the total is only part of the truth.
export const renderTotals = (visibleRows) => {
  const { lockedInUsd, issuedInUsd, excessInUsd, priced, total } = sumRows(visibleRows);
  const loadingRows = visibleRows.filter(({ locked, issued, homeRate, foreignRate }) =>
    [locked, issued, homeRate, foreignRate].some(field => field && isUnsettled(field))
  ).length;

  const settling = loadingRows > 0;
  const pending = settling && priced === 0;
  const nothingPriced = priced === 0;

  const note = total === 0 ? 'no bridges'
    : settling ? `${total - loadingRows} of ${total} in so far`
    : priced === total ? `${total} bridges`
    : `${priced} of ${total} priced`;

  return (
    <Table.Summary fixed>
      <Table.Summary.Row>
        <Table.Summary.Cell index={0}>
          <b>Total</b>
          <div style={{ fontSize: 12, opacity: .5 }}>
            {settling && <LoadingOutlined spin style={{ marginRight: 6 }} />}{note}
          </div>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={1} />
        <Table.Summary.Cell index={2}><TotalCell value={nothingPriced ? null : lockedInUsd} pending={pending} settling={settling} /></Table.Summary.Cell>
        <Table.Summary.Cell index={3} />
        <Table.Summary.Cell index={4}><TotalCell value={nothingPriced ? null : issuedInUsd} pending={pending} settling={settling} /></Table.Summary.Cell>
        <Table.Summary.Cell index={5}><TotalCell value={nothingPriced ? null : excessInUsd} pending={pending} settling={settling} /></Table.Summary.Cell>
      </Table.Summary.Row>
    </Table.Summary>
  );
}

export const AuditTable = () => {
  const rows = useSelector(selectAuditTableRows);

  const [query, setQuery] = useState('');
  const [exportNetwork, setExportNetwork] = useState();
  const [importNetwork, setImportNetwork] = useState();
  const [sort, setSort] = useState(DEFAULT_SORT);

  // Rebuilt on every render on purpose: the header controls are part of the columns, so they
  // change with every keystroke anyway, and 23 rows make memoising pointless.
  const columns = getColumns({
    search: { value: query, onChange: setQuery },
    exportSide: { networks: uniqueSorted(rows.map(({ bridge }) => bridge.home_network)), value: exportNetwork, onChange: setExportNetwork },
    importSide: { networks: uniqueSorted(rows.map(({ bridge }) => bridge.foreign_network)), value: importNetwork, onChange: setImportNetwork },
    sort,
  });

  return (
    <Table
      columns={columns}
      dataSource={filterRows(rows, { query, exportNetwork, importNetwork })}
      pagination={false}
      scroll={{ x: 900 }}
      size="middle"
      summary={renderTotals}
      // antd's header tooltip offers to cancel the sorting on the last click of the cycle, which
      // is exactly what nextSort takes away
      showSorterTooltip={false}
      onChange={(_pagination, _filters, sorter) => setSort(nextSort(sorter))}
    />
  );
}
