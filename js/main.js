var game = {};
(function ($) {
    var key = 'rvn_ms',
        disabled = 0,
        gs = $('#game'),
        settings = $('#settings'),
        l = {
            easy: {
                cells: 36,
                cols: 6,
                rows: 6,
                mines: 6,
                level: 'easy'
            },
            normal: {
                cells: 81,
                cols: 9,
                rows: 9,
                mines: 13,
                level: 'normal'
            },
            hard: {
                cells: 256,
                cols: 16,
                rows: 16,
                mines: 40,
                level: 'hard'
            },
            expert: {
                cells: 480,
                cols: 30,
                rows: 16,
                mines: 99,
                level: 'expert'
            },
        },
        checking = [];

    settings.on('click', 'button', function (e) {
        e.preventDefault();
        if (confirm("Are you sure you want to start a new game?") === true) {
            var k = $(this).text().toLowerCase();
            setDifficulty(k);
            start(true);
        }
    });

    gs
        .on('click', '.cell', function (e) {
            e.preventDefault();
            var elem = $(this),
                i = elem.data('cell');
            if (!elem.hasClass('o') && !elem.hasClass('f')) click(i);
        })
        .on('contextmenu', '.cell', function (e) {
            e.preventDefault();
            var elem = $(this),
                i = elem.data('cell');
            if (elem.hasClass('o')) return;
            if (elem.hasClass('f')) {
                elem.removeClass('f');
                elem.addClass('q');
                pull(i, game.f);
                game.q.push(i);
            } else if (elem.hasClass('q')) {
                elem.removeClass('q');
                pull(i, game.q);
            } else {
                elem.addClass('f');
                game.f.push(i);
            }
            save();
            infobox();
        });

    function setDifficulty(k) {
        settings.find('.active').removeClass('active');
        settings.find('.' + k).addClass('active');
    }

    function f(v) {
        var p = v < 0 ? '' : v < 10 ? '00' : v < 100 ? '0' : '';
        return p + v.toString();
    }

    function pull(v, a = []) {
        var i = a.indexOf(v);
        if (i > -1) {
            a.splice(i, 1);
        }
        return a;
    }

    function infobox() {
        var mines = game.mines - gs.find('.cell.f').length,
            cells = game.cells - gs.find('.cell.o').length;

        if(cells === game.mines) {
            game.state = -2;
            setTimeout(game_over(), 1);
        }

        $('#cells').text(f(cells));
        $('#mines').text(f(mines));
    }

    function get_game() {
        var a = l[settings.find('.active').text().toLowerCase()];
        a['matrix'] = [];
        a['key'] = [];
        a['f'] = [];
        a['q'] = [];
        a['state'] = 1;
        return a;
    }

    function save() {
        if (!game) {
            game = get_game();
        }
        window.localStorage.setItem(key, JSON.stringify(game));
    }

    function generate() {
        while (game.key.length < game.mines) {
            var n = Math.floor(Math.random() * game.cells);
            if (!hasBomb(n)) {
                game.key.push(n);
            }
        }
    }

    function hasBomb(i) {
        return game.key.includes(i);
    }

    function get_value(i) {
        if( game.matrix[i] > 0 ) return game.matrix[i];
        if( checking.includes(i) ) return false;
        checking.push(i);
        var b = 0, check = [];

        if(i >= game.cols) {
            check.push(i-game.cols);
            if((i % game.cols) > 0) check.push((i-game.cols)-1);
            if((i % game.cols) !== (game.cols - 1)) check.push((i-game.cols)+1);
        }

        if(Math.ceil((i+1) / game.cols) < game.rows) {
            check.push(i+game.cols);
            if((i % game.cols) > 0) check.push((i+game.cols)-1);
            if((i % game.cols) !== (game.cols - 1)) check.push((i+game.cols)+1);
        }

        if((i % game.cols) > 0) check.push(i-1);
        if((i % game.cols) !== (game.cols - 1)) check.push(i+1);

        for(var c=0; c<check.length ;c++) {
            if(game.key.includes(check[c])) b++;
        }

        if(b === 0) {
            for(var c=0; c<check.length ;c++) {
                if( game.matrix[check[c]] == 0 ) {
                    game.matrix[check[c]] = get_value(check[c]);
                }
            }
        }

        return b === 0 ? 9 : b;
    }

    function click(i) {
        if (disabled || i === false) return;

        checking = [];

        if(hasBomb(i)) {
            game.matrix[i] = -1;
            save();
            render();
        } else {
            game.matrix[i] = get_value(i)
            save();
            render();
        }
    }

    function draw() {
        if (!game.matrix.length) {
            game.matrix = '0'.repeat(game.cells).split('');
        }
        var h = '',
            ww = window.outerWidth > 1200 ? 1200 : window.outerWidth,
            w = Math.floor(ww / game.cols),
            m = game.matrix;
        w = w > 50 ? 50 : w; // max width

        for (var i = 0; i < m.length; i++) {
            var v = '',
                c = 'cell',
                s = 'width:' + w + 'px;height:' + w + 'px;';

            switch (parseInt(m[i])) {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                    c = c + ' o c-' + m[i];
                    v = m[i];
                    s = s + 'line-height:' + (w - 5) + 'px;';
                    s = s + 'font-size:' + (w - 15) + 'px;';
                    break;
                case 9:
                    c = c + ' o';
                    break;
                case -1:
                    c = c + ' b';
                    game.state = -1;
                    save();
                    break;
                default:
                    break;
            }
            if (game.q.includes(i)) c = c + ' q';
            if (game.f.includes(i)) c = c + ' f';
            h = h + '<div class="' + c + '" data-cell="' + i + '" style="' + s + '">' + v + '</div>';
        }
        $('#game_wrapper').css('max-width', ((game.cols * w) + 30) + 'px'); // +30 because of padding
        gs.css({
            width: ((game.cols * w) + 4) + 'px',
            height: ((game.rows * w) + 4) + 'px'
        });
        gs.find('.screen').html('');
        gs.find('.screen').html(h);

        return game;
    }

    function render() {
        var g = draw();

        if (g.state > 0) {
            infobox();
        } else {
            setTimeout(game_over, 1);
        }

        disabled = 0;
    }

    function new_game() {
        game = get_game();
        generate();
        save();

        return game;
    }

    function start(n) {
        if (n) {
            game = new_game();
        } else {
            game = JSON.parse(window.localStorage.getItem(key));
        }
        save();
        setDifficulty(game.level);
        render();
        gs.addClass('ready');
    }

    function game_over() {
        if(gs.hasClass('ready')) {
            if(game.state == -1) {
                alert('Game Over!');
                for (var i = 0; i < game.key.length; i++) {
                    game.matrix[game.key[i]] = -1;
                }
                draw();
            } else {
                alert('Wow! You win!');
            }
        }
        disabled = 1;
    }

    start(false);
})(jQuery);
