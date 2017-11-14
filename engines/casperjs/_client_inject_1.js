/* global $ */


//=====================================================================
function CI_GetFirst_innerText( Selector )
{
	var items = document.querySelectorAll( Selector );
	if( items == null ) { return null; }
	if( items.length == 0 ) { return null; }
	return items[ 0 ].innerText;
}


//=====================================================================
function CI_Get_innerText( Selector )
{
	var items = document.querySelectorAll( Selector );
	return Array.prototype.map.call( items, function( item )
	{
		return item.innerText;
	});
}


//=====================================================================
function CI_Get_href( Selector )
{
	var items = document.querySelectorAll( Selector );
	return Array.prototype.map.call( items, function( item )
	{
		return item.href;
	});
}


//=====================================================================
function CI_Get_Attribute( Selector, AttributeName )
{
	var items = document.querySelectorAll( Selector );
	return Array.prototype.map.call( items, function( item )
	{
		return item.getAttribute( AttributeName );
	});
}


//=====================================================================
function CI_ArrayTable_NewCell( Text )
{
	var array_table_cell = {};
	if( typeof Text == 'undefined' )
	{
		array_table_cell.Text = '';
		array_table_cell.IsEmpty = true;
	}
	else
	{
		array_table_cell.Text = Text;
		array_table_cell.IsEmpty = false;
	}
	array_table_cell.RowSpan = 1;
	array_table_cell.ColSpan = 1;
	array_table_cell.Link = '';
	return array_table_cell;
}


//=====================================================================
function CI_ArrayTable_New()
{
	var array_table = {};
	array_table.ColumnCount = 0;
	array_table.Rows = [];
	return array_table;
}


//=====================================================================
function CI_ArrayTable_Grow( ArrayTable, RowCount, ColumnCount )
{
	// Set new ColumnCount if growing columns.
	if( ArrayTable.ColumnCount < ColumnCount )
	{
		ArrayTable.ColumnCount = ColumnCount;
	}
	
	// Append new rows.
	while( ArrayTable.Rows.length < RowCount )
	{
		ArrayTable.Rows.push( [] );
	}
	
	// Enforce ColumnCount.
	for( var row_index = 0; row_index < ArrayTable.Rows.length; row_index++ )
	{
		var cells = ArrayTable.Rows[ row_index ];
		while( cells.length < ArrayTable.ColumnCount )
		{
			var new_cell = CI_ArrayTable_NewCell();
			cells.push( new_cell );
		}
	}
	
	return;
}


//=====================================================================
function CI_HtmlTable_Append_ArrayTable( HtmlTable, ArrayTable )
{
	$(ArrayTable.Rows).each
	(
		function( RowIndex, Row )
		{
			var tr = HtmlTable.insertRow( -1 );
			$(Row).each
			(
				function( CellIndex, Cell )
				{
					var td = tr.insertCell( -1 );
					td.innerHTML = Cell.Text;
					//console.log( 'AppendRows: [ ' + RowIndex + ', ' + CellIndex + ' ] = ' + td.innerHTML );
				}
			);
		}
	);
	return;
}


//=====================================================================
function CI_HtmlElement_To_ArrayTableCell( HtmlElement, ArrayTableCell )
{
	if( HtmlElement === null )
	{
		ArrayTableCell.Text = '';
		ArrayTableCell.RowSpan = 1;
		ArrayTableCell.ColSpan = 1;
		ArrayTableCell.IsEmpty = false;
		ArrayTableCell.Link = '';
	}
	else
	{
		ArrayTableCell.Text = HtmlElement.innerText;
		ArrayTableCell.RowSpan = HtmlElement.rowSpan;
		ArrayTableCell.ColSpan = HtmlElement.colSpan;
		ArrayTableCell.IsEmpty = false;
		ArrayTableCell.Link = '';

		// Look for hyperlinks.
		for( var child_index = 0; child_index < HtmlElement.childNodes.length; child_index++ )
		{
			var child_node = HtmlElement.childNodes.item( child_index );
			if( child_node.tagName === 'A' )
			{
				ArrayTableCell.Link = child_node.href;
			}
		}
		
	}
	return;
}


//=====================================================================
function CI_HtmlTable_To_ArrayTable( HtmlTable, SpanCells, FillSpans )
{
	if( HtmlTable === null ) { return null; }
	if( typeof HtmlTable == 'undefined' ) { return null; }
	if( typeof SpanCells == 'undefined' ) { SpanCells = false; }
	if( typeof FillSpans == 'undefined' ) { FillSpans = false; }
	
	var array_table = CI_ArrayTable_New();
	// if( HtmlTable === null ) { return array_table; }
	// if( typeof HtmlTable == 'undefined' ) { return array_table; }
	
	// Get the table size.
	var row_count = HtmlTable.rows.length;
	var column_count = 0;
	var row_index = 0;
	for( row_index = 0; row_index < row_count; row_index++ )
	{
		var cells_count = HtmlTable.rows[ row_index ].cells.length;
		if( column_count < cells_count )
		{
			column_count = cells_count;
		}
	}
	
	// Grow the table.
	CI_ArrayTable_Grow( array_table, row_count, column_count );
	
	// Map the content.
	for( row_index = 0; row_index < row_count; row_index++ )
	{
		var html_cells = HtmlTable.rows[ row_index ].cells;
		for( var col_index = 0; col_index < html_cells.length; col_index++ )
		{
			// Create a new array cell.
			var html_cell = html_cells[ col_index ];
			
			// Find the next empty cell.
			var array_col_index = col_index;
			while( array_table.Rows[ row_index ][ array_col_index ].IsEmpty === false )
			{
				array_col_index++;
				// We can get an incorrect column count above if a rowspan is used.
				// The Html functions will not take into account any columns created as a result of a rowspan.
				if( array_col_index >= array_table.ColumnCount )
				{
					CI_ArrayTable_Grow( array_table, array_table.Rows.length, array_table.ColumnCount + 1 );
				}
			}
			
			// Set the array cell in the array table.
			var new_cell = null;
			if( SpanCells )
			{
				for( var rowspan = 0; rowspan < html_cell.rowSpan; rowspan++ )
				{
					for( var colspan = 0; colspan < html_cell.colSpan; colspan++ )
					{
						if( (FillSpans === false) && ((rowspan > 0) || (colspan > 0)) )
						{
							if( (row_index + rowspan < array_table.Rows.length) && (array_col_index + colspan < array_table.ColumnCount) )
							{
								// A blank span cell.
								var new_row_index = row_index + rowspan;
								var new_col_index = array_col_index + colspan;
								new_cell = CI_ArrayTable_NewCell();
								CI_HtmlElement_To_ArrayTableCell( null, new_cell );
								array_table.Rows[ new_row_index ][ new_col_index ] = new_cell;
							}
						}
						else
						{
							if( (row_index + rowspan < array_table.Rows.length) && (array_col_index + colspan < array_table.ColumnCount) )
							{
								// A content cell.
								var new_row_index = row_index + rowspan;
								var new_col_index = array_col_index + colspan;
								new_cell = CI_ArrayTable_NewCell();
								CI_HtmlElement_To_ArrayTableCell( html_cell, new_cell );
								array_table.Rows[ new_row_index ][ new_col_index ] = new_cell;
							}
						}
					}
				}
			}
			else
			{
				if( (row_index < array_table.Rows.length) && (array_col_index < array_table.ColumnCount) )
				{
					// A content cell.
					var new_row_index = row_index;
					var new_col_index = array_col_index;
					new_cell = CI_ArrayTable_NewCell();
					CI_HtmlElement_To_ArrayTableCell( html_cell, new_cell );
					array_table.Rows[ new_row_index ][ new_col_index ] = new_cell;
				}
			}
		}
	}
	
	return array_table;
}





