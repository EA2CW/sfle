# Table download options

Under the contacts table, to the right-hand side, on the same line as the 'Total QSO' count add two buttons.
You may need to use an icon library to find the correct buttons.

The buttons should implement the following facilities:
 - Download contacts as a Markdown Table
 - Download contacts as a fixed-width text file

When downloading as fixed width, the requirement is to have each column delimited with one or more tab characters
so that all content in the column lines up vertically. This will require you to access the maximum column width in
each case, and adjust the number of tab characters used for smaller content as appropriate. The column headings
should be separated by a full-table width line of dash characters '-'.