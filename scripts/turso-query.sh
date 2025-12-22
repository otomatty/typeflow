#!/bin/bash
#
# Tursoデータベースクエリスクリプト
#
# 使用方法:
#   ./scripts/turso-query.sh list-presets           # プリセット一覧
#   ./scripts/turso-query.sh list-words             # 単語一覧（最初の20件）
#   ./scripts/turso-query.sh find-wo-issues         # 「を」の問題を検索
#   ./scripts/turso-query.sh update-romaji <id> <romaji>  # romajiを更新
#   ./scripts/turso-query.sh custom "<SQL>"         # カスタムSQLを実行
#
# 環境変数:
#   TURSO_DB_NAME: データベース名（デフォルト: typeflow-db）
#

set -e

DB_NAME="${TURSO_DB_NAME:-typeflow-db}"

# ヘルプを表示
show_help() {
    echo "📦 Turso Query Script - TypeFlow データベース管理"
    echo ""
    echo "使用方法:"
    echo "  $0 <command> [args]"
    echo ""
    echo "コマンド:"
    echo "  list-presets              プリセット一覧を表示"
    echo "  list-words [limit]        単語一覧を表示（デフォルト: 20件）"
    echo "  show-word <id>            特定の単語を表示"
    echo "  find-wo-issues            「を」の問題がある単語を検索"
    echo "  update-romaji <id> <romaji>  wordsテーブルのromajiを更新"
    echo "  custom \"<SQL>\"            カスタムSQLを実行"
    echo "  shell                     Tursoシェルを起動"
    echo ""
    echo "環境変数:"
    echo "  TURSO_DB_NAME: データベース名（デフォルト: typeflow-db）"
    echo ""
    echo "例:"
    echo "  $0 list-presets"
    echo "  $0 find-wo-issues"
    echo "  $0 update-romaji 230 \"satoutosiowomatigaeta\""
    echo "  $0 custom \"SELECT COUNT(*) FROM words\""
}

# Tursoがインストールされているか確認
check_turso() {
    if ! command -v turso &> /dev/null; then
        echo "❌ Turso CLIがインストールされていません"
        echo "インストール: curl -sSfL https://get.tur.so/install.sh | bash"
        exit 1
    fi
}

# SQLクエリを実行
run_query() {
    turso db shell "$DB_NAME" "$1"
}

# メイン処理
main() {
    check_turso

    case "$1" in
        list-presets)
            echo "📋 Presets:"
            run_query "SELECT id, name, difficulty, word_count FROM presets ORDER BY name;"
            ;;

        list-words)
            limit="${2:-20}"
            echo "📝 Words (first $limit):"
            run_query "SELECT id, text, reading, romaji FROM words LIMIT $limit;"
            ;;

        show-word)
            if [ -z "$2" ]; then
                echo "Usage: $0 show-word <id>"
                exit 1
            fi
            run_query "SELECT * FROM words WHERE id = $2;"
            ;;

        find-wo-issues)
            echo "🔍 Finding 「を」 romaji issues..."
            echo ""
            echo "Words with 「を」 in reading:"
            run_query "SELECT id, text, reading, romaji FROM words WHERE reading LIKE '%を%' ORDER BY id;"
            echo ""
            echo "Note: Check if romaji contains 'wo' where reading has 「を」"
            ;;

        update-romaji)
            if [ -z "$2" ] || [ -z "$3" ]; then
                echo "Usage: $0 update-romaji <id> <new_romaji>"
                exit 1
            fi
            echo "Updating word ID $2..."
            run_query "UPDATE words SET romaji = '$3' WHERE id = $2;"
            echo "✅ Updated!"
            echo ""
            echo "Verification:"
            run_query "SELECT id, text, reading, romaji FROM words WHERE id = $2;"
            ;;

        custom)
            if [ -z "$2" ]; then
                echo "Usage: $0 custom \"<SQL>\""
                exit 1
            fi
            run_query "$2"
            ;;

        shell)
            echo "🔗 Opening Turso shell for $DB_NAME..."
            turso db shell "$DB_NAME"
            ;;

        -h|--help|help|"")
            show_help
            ;;

        *)
            echo "❌ Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"

