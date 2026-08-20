//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {

  // Sortable tables
  // Works on any table with class "has-sortable-table"
  // Finds columns with [aria-sort] and makes them clickable to sort
  document.querySelectorAll('.has-sortable-table [aria-sort] a').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault()

      var th = link.closest('th')
      var table = th.closest('table')
      var tbody = table.querySelector('tbody')
      var columnIndex = Array.from(th.parentNode.children).indexOf(th)
      var currentSort = th.getAttribute('aria-sort')
      var newSort = currentSort === 'ascending' ? 'descending' : 'ascending'

      // Reset all other sortable columns in this table
      table.querySelectorAll('[aria-sort]').forEach(function (otherTh) {
        if (otherTh !== th) {
          otherTh.setAttribute('aria-sort', 'none')
        }
      })

      th.setAttribute('aria-sort', newSort)

      // Sort the rows
      var rows = Array.from(tbody.querySelectorAll('tr'))
      rows.sort(function (a, b) {
        var cellA = a.children[columnIndex].textContent.trim()
        var cellB = b.children[columnIndex].textContent.trim()

        // Try numeric sort first (handles "2 days", "0 days" etc)
        var numA = parseFloat(cellA)
        var numB = parseFloat(cellB)

        if (!isNaN(numA) && !isNaN(numB)) {
          return newSort === 'ascending' ? numA - numB : numB - numA
        }

        // Fall back to alphabetical
        if (newSort === 'ascending') {
          return cellA.localeCompare(cellB)
        } else {
          return cellB.localeCompare(cellA)
        }
      })

      // Re-append rows in new order
      rows.forEach(function (row) {
        tbody.appendChild(row)
      })

      // Re-paginate after sorting
      var paginationNav = table.parentNode.querySelector('[data-pagination]')
      if (paginationNav) {
        paginateTable(table, paginationNav, 1)
      }
    })
  })

  // Client-side table filtering
  // Works on any form with a data-filter-column attribute
  // The attribute value is the column index (0-based) to filter on
  // Filters the table(s) in the same grid row
  document.querySelectorAll('form[data-filter-column]').forEach(function (form) {
    var columnIndex = parseInt(form.getAttribute('data-filter-column'), 10)

    form.addEventListener('submit', function (e) {
      e.preventDefault()
      applyFilters(form, columnIndex)
    })
  })

  // Clear filters
  document.querySelectorAll('[data-clear-filters]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault()
      var form = link.closest('.govuk-grid-column-one-quarter').querySelector('form[data-filter-column]')
      if (!form) return

      form.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
        cb.checked = false
      })

      var columnIndex = parseInt(form.getAttribute('data-filter-column'), 10)
      applyFilters(form, columnIndex)
    })
  })

  function applyFilters(form, columnIndex) {
    var checked = Array.from(form.querySelectorAll('input[type="checkbox"]:checked'))
    var selectedValues = checked.map(function (cb) {
      return cb.value.trim().toLowerCase()
    })

    var gridRow = form.closest('.govuk-grid-row')
    // Only filter the currently visible tab panel's table
    var activePanel = gridRow.querySelector('.govuk-tabs__panel:not(.govuk-tabs__panel--hidden)')
    if (!activePanel) return

    var table = activePanel.querySelector('table.govuk-table')
    if (!table) return

    var rows = table.querySelectorAll('tbody tr')
    rows.forEach(function (row) {
      row.removeAttribute('data-filter-hidden')
      if (selectedValues.length === 0) {
        row.style.display = ''
        return
      }
      var cell = row.children[columnIndex]
      if (!cell) return
      var cellText = cell.textContent.trim().toLowerCase()
      if (selectedValues.indexOf(cellText) !== -1) {
        row.style.display = ''
      } else {
        row.style.display = 'none'
        row.setAttribute('data-filter-hidden', 'true')
      }
    })

    // Re-paginate after filtering
    var paginationNav = activePanel.querySelector('[data-pagination]')
    if (paginationNav) {
      paginateTable(table, paginationNav, 1)
    }
  }

  // Client-side search
  // Works on any element with data-search-table
  // Searches all text in each row across all tables in the same content area
  document.querySelectorAll('[data-search-table]').forEach(function (searchGroup) {
    var input = searchGroup.querySelector('input[type="text"]')
    var button = searchGroup.querySelector('button')
    var resultsMsg = searchGroup.querySelector('[data-search-results]')

    if (!input || !button) return

    button.addEventListener('click', function (e) {
      e.preventDefault()
      doSearch(input, resultsMsg, searchGroup)
    })

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault()
        doSearch(input, resultsMsg, searchGroup)
      }
    })
  })

  function doSearch(input, resultsMsg, searchGroup) {
    var searchTerm = input.value.trim().toLowerCase()
    var container = searchGroup.closest('.govuk-grid-column-three-quarters') || searchGroup.closest('.govuk-grid-row')
    // Only search the currently visible tab panel's table
    var activePanel = container.querySelector('.govuk-tabs__panel:not(.govuk-tabs__panel--hidden)')
    var tables = activePanel ? [activePanel.querySelector('table.govuk-table')] : Array.from(container.querySelectorAll('table.govuk-table'))
    var totalVisible = 0

    tables.forEach(function (table) {
      if (!table) return
      var rows = table.querySelectorAll('tbody tr')
      rows.forEach(function (row) {
        // Don't touch rows already hidden by filters
        if (row.getAttribute('data-filter-hidden') === 'true') return

        row.removeAttribute('data-search-hidden')
        if (!searchTerm) {
          row.style.display = ''
          totalVisible++
          return
        }
        var rowText = row.textContent.trim().toLowerCase()
        if (rowText.indexOf(searchTerm) !== -1) {
          row.style.display = ''
          totalVisible++
        } else {
          row.style.display = 'none'
          row.setAttribute('data-search-hidden', 'true')
        }
      })
    })

    if (resultsMsg) {
      if (!searchTerm) {
        resultsMsg.hidden = true
        resultsMsg.textContent = ''
      } else {
        resultsMsg.hidden = false
        var resultWord = totalVisible === 1 ? 'result' : 'results'
        resultsMsg.textContent = totalVisible + ' ' + resultWord + ' for \u2018' + input.value.trim() + '\u2019'
      }
    }

    // Re-paginate after search
    tables.forEach(function (table) {
      if (!table) return
      var paginationNav = table.parentNode.querySelector('[data-pagination]')
      if (paginationNav) {
        paginateTable(table, paginationNav, 1)
      }
    })
  }

  // Client-side pagination
  // Works on any table with data-page-size attribute
  // Renders GOV.UK pagination component markup
  var range = function (start, end) {
    return Array.from({ length: end - start + 1 }, function (_, i) { return start + i })
  }

  var paginate = function (min, max, current) {
    if (max <= 1) return [1]
    var left = current - min > 3 ? [min, '...', current - 1, current] : range(min, current)
    var right = max - current > 3 ? [current + 1, '...', max] : range(current + 1, max)
    return left.concat(right)
  }

  function paginateTable(table, paginationNav, currentPage) {
    var pageSize = parseInt(table.getAttribute('data-page-size'), 10) || 25
    var allRows = Array.from(table.querySelectorAll('tbody tr'))

    // Visible rows are those not hidden by filter or search
    var visibleRows = allRows.filter(function (row) {
      return row.getAttribute('data-filter-hidden') !== 'true' && row.getAttribute('data-search-hidden') !== 'true'
    })

    var totalPages = Math.ceil(visibleRows.length / pageSize)
    if (totalPages < 1) totalPages = 1
    if (currentPage > totalPages) currentPage = totalPages

    // Hide all visible rows first
    visibleRows.forEach(function (row) {
      row.style.display = 'none'
    })

    // Show only current page's rows
    var start = (currentPage - 1) * pageSize
    var end = start + pageSize
    var pageRows = visibleRows.slice(start, end)
    pageRows.forEach(function (row) {
      row.style.display = ''
    })

    // Render pagination
    if (totalPages <= 1) {
      paginationNav.innerHTML = ''
      // Show all visible rows if only 1 page
      visibleRows.forEach(function (row) {
        row.removeAttribute('data-paginated-hidden')
        row.style.display = ''
      })
      return
    }

    var pages = paginate(1, totalPages, currentPage)
    var html = ''

    // Previous
    if (currentPage > 1) {
      html += '<div class="govuk-pagination__prev">'
      html += '<a class="govuk-link govuk-pagination__link" href="#" data-page="' + (currentPage - 1) + '" aria-label="Previous page">'
      html += '<svg class="govuk-pagination__icon govuk-pagination__icon--prev" xmlns="http://www.w3.org/2000/svg" height="13" width="15" aria-hidden="true" focusable="false" viewBox="0 0 15 13">'
      html += '<path d="m6.5938-0.0078125-6.7266 6.7266 6.7441 6.4062 1.377-1.449-4.1856-3.9768h12.896v-2h-12.984l4.2931-4.293-1.414-1.414z"></path></svg>'
      html += '<span class="govuk-pagination__link-title">Previous</span></a></div>'
    }

    // Page numbers
    html += '<ul class="govuk-pagination__list">'
    pages.forEach(function (page) {
      if (page === '...') {
        html += '<li class="govuk-pagination__item govuk-pagination__item--ellipses">&ctdot;</li>'
      } else if (page === currentPage) {
        html += '<li class="govuk-pagination__item govuk-pagination__item--current">'
        html += '<a class="govuk-link govuk-pagination__link" href="#" data-page="' + page + '" aria-label="Page ' + page + '" aria-current="page">' + page + '</a></li>'
      } else {
        html += '<li class="govuk-pagination__item">'
        html += '<a class="govuk-link govuk-pagination__link" href="#" data-page="' + page + '" aria-label="Page ' + page + '">' + page + '</a></li>'
      }
    })
    html += '</ul>'

    // Next
    if (currentPage < totalPages) {
      html += '<div class="govuk-pagination__next">'
      html += '<a class="govuk-link govuk-pagination__link" href="#" data-page="' + (currentPage + 1) + '" aria-label="Next page">'
      html += '<span class="govuk-pagination__link-title">Next</span>'
      html += '<svg class="govuk-pagination__icon govuk-pagination__icon--next" xmlns="http://www.w3.org/2000/svg" height="13" width="15" aria-hidden="true" focusable="false" viewBox="0 0 15 13">'
      html += '<path d="m8.107-0.0078125-1.4136 1.414 4.2926 4.293h-12.986v2h12.896l-4.1855 3.9766 1.377 1.4492 6.7441-6.4062-6.7246-6.7266z"></path></svg>'
      html += '</a></div>'
    }

    paginationNav.innerHTML = html

    // Add click handlers to page links
    paginationNav.querySelectorAll('[data-page]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault()
        var newPage = parseInt(link.getAttribute('data-page'), 10)
        paginateTable(table, paginationNav, newPage)
      })
    })
  }

  // Initialise pagination on page load
  document.querySelectorAll('table[data-page-size]').forEach(function (table) {
    var paginationNav = table.parentNode.querySelector('[data-pagination]')
    if (paginationNav) {
      paginateTable(table, paginationNav, 1)
    }
  })

  // Row selection - grey out rows when checkbox is ticked
  document.querySelectorAll('.govuk-table .govuk-checkboxes__input').forEach(function (checkbox) {
    checkbox.addEventListener('change', function () {
      var row = checkbox.closest('tr')
      if (!row) return
      if (checkbox.checked) {
        row.classList.add('govuk-table__row--selected')
      } else {
        row.classList.remove('govuk-table__row--selected')
      }
    })
  })

})
