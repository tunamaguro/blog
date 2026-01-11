---
title: "CMakeとGTestでカバレッジを取る"
createdAt: "2026-01-11"
emoji: "🧪"
category: "tech"
---

GTestでClangのSource-based Code Coverageを取れたのでその備忘録です。以下常体で記載

## 参考

- https://clang.llvm.org/docs/SourceBasedCodeCoverage.html
  - Clang公式
- https://zenn.dev/misokatsu6/articles/clang-source-based-coverage
  - 各種オプションについて参考にした

## 成果物

https://github.com/tunamaguro/clang-devcontainer-template

`coverage`プリセットをビルドするとテストカバレッジ取得、レポート出力まで行うように設定した

```bash
$ cmake --build --preset coverage 
[ 13%] Built target gtest
[ 26%] Built target gtest_main
[ 40%] Built target mytests
[ 46%] Removing old coverage data
[ 46%] Built target coverage_clean
[ 53%] Building & running tests for coverage
Test project /workspaces/clang-devcontainer-template/build/coverage
    Start 1: MyLib.foo
1/2 Test #1: MyLib.foo ........................   Passed    0.00 sec
    Start 2: MyLib.bar
2/2 Test #2: MyLib.bar ........................   Passed    0.00 sec

100% tests passed, 0 tests failed out of 2

Total Test time (real) =   0.00 sec
[ 53%] Built target coverage_run_tests
[ 60%] Merging coverage data
[ 60%] Built target coverage_merge
[ 66%] Generating HTML coverage report
HTML coverage report generated at: /workspaces/clang-devcontainer-template/build/coverage/coverage-report
[ 66%] Built target coverage_report_html
[ 73%] Generating coverage report summary
Filename                      Regions    Missed Regions     Cover   Functions  Missed Functions  Executed       Lines      Missed Lines     Cover    Branches   Missed Branches     Cover    MC/DC Conditions    Missed Conditions     Cover
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
bar.hpp                             8                 0   100.00%           1                 0   100.00%           6                 0   100.00%           6                 0   100.00%                   3                    0   100.00%
foo.hpp                             1                 0   100.00%           1                 0   100.00%           3                 0   100.00%           0                 0         -                   0                    0         -
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
TOTAL                               9                 0   100.00%           2                 0   100.00%           9                 0   100.00%           6                 0   100.00%                   3                    0   100.00%
[ 73%] Built target coverate_report_summary
[ 73%] Built target coverage
[ 86%] Built target gmock
[100%] Built target gmock_main
```

## カバレッジ取得から表示までの流れ

CMakeを使わない場合、次の3ステップを行いカバレッジ取得と表示を行う

0. カバレッジを取りたいプログラムを用意する

今回は次を使う

```bash
cat <<EOF > foo.cc
#define BAR(x) ((x) || (x))
template <typename T> void foo(T x) {
  for (unsigned I = 0; I < 10; ++I) { BAR(I); }
}
int main() {
  foo<int>(0);
  foo<float>(0);
  return 0;
}
EOF
```

1. カバレッジを有効にしてコンパイルする

```bash
clang++ \
    -fprofile-instr-generate -fcoverage-mapping # ここ。mcdc測定も行う場合は`-fcoverage-mcdc`もつける \
     foo.cc -o foo
```

2. コンパイルされたプログラムを実行する

作ったバイナリを実行すると生プロファイル`default.profraw`が生成される。この出力先は環境変数`LLVM_PROFILE_FILE`で変更でき、以下の特殊パターン文字列を使える。
ここでは便利そうなものだけ記載するため、詳細は[ドキュメントを確認のこと](https://clang.llvm.org/docs/SourceBasedCodeCoverage.html#:~:text=%E2%80%9C%25p%E2%80%9D%20expands%20out,porting%20this%20feature.)

- `%p`: 実行したプロセス番号に置換される。複数のバイナリからカバレッジを得るときに使えそう
- `%Nm`: バイナリのシグネチャに展開されるらしい。`N`は任意の整数で指定しない場合1として扱われる。どういう原理で値が置換されているかよくわかっていないが、衝突回避に使える
  - `LLVM_PROFILE_FILE=coverage-%m.profraw`の時、`coverage-5874964722250661542_0.profraw`
  - `LLVM_PROFILE_FILE=coverage-%2m.profraw`の時、`coverage-5874964722250661542_0.profraw`と`coverage-5874964722250661542_1.profraw`

```bash
LLVM_PROFILE_FILE="foo.profraw" ./foo
```

3. 生プロファイルをインデックスする

生プロファイルをインデックス付プロファイルにする。この時複数のプロファイルをまとめられる。[LLVMのコード](https://github.com/llvm/llvm-project/blob/main/llvm/utils/prepare-code-coverage-artifact.py)が参考になる

```bash
llvm-profdata merge -sparse foo.profraw -o foo.profdata
```

4. カバレッジレポートを作成する

```bash
llvm-cov show ./foo -instr-profile=foo.profdata \
    -Xdemangler=c++filt \
    -show-line-counts-or-regions \ 
    -show-directory-coverage
```

> - `-Xdemangler=c++filt`: 名前マングルされ可読性が低い名前をデマングルし人間に読みやすくする
> - `-show-line-counts-or-regions`: 1行の実行回数とその部分の実行回数が異なる個所を`^`で示す
> - `-show-directory-coverage`: ディレクトリごとのカバレッジを表示する

```bash title="出力例"
    1|     20|#define BAR(x) ((x) || (x))
                                     ^2
    2|      2|template <typename T> void foo(T x) {
    3|     22|  for (unsigned I = 0; I < 10; ++I) { BAR(I); }
                                             ^20  ^20^20
    4|      2|}
  ------------------
  | void foo<int>(int):
  |    2|      1|template <typename T> void foo(T x) {
  |    3|     11|  for (unsigned I = 0; I < 10; ++I) { BAR(I); }
  |                                             ^10  ^10^10
  |    4|      1|}
  ------------------
  | void foo<float>(float):
  |    2|      1|template <typename T> void foo(T x) {
  |    3|     11|  for (unsigned I = 0; I < 10; ++I) { BAR(I); }
  |                                             ^10  ^10^10
  |    4|      1|}
  ------------------
    5|      1|int main() {
    6|      1|  foo<int>(0);
    7|      1|  foo<float>(0);
    8|      1|  return 0;
    9|      1|}
```

HTMLとしてレポートを得たい場合は追加で`-format=html -output-dir=output-dir-path`を指定する

```bash
llvm-cov show ./foo -instr-profile=foo.profdata \
    -Xdemangler=c++filt \
    -show-line-counts-or-regions \
    -show-directory-coverage \
    -format=html -output-dir=cov_html
```

![出力されたHTMLレポート](coverage_html.png)


外部ライブラリをリンクしている場合はフィルターで自分のプログラムだけ表示するようにできる

```bash
llvm-cov show ./foo -instr-profile=foo.profdata \
    -Xdemangler=c++filt \
    -show-line-counts-or-regions \
    -show-directory-coverage \
    -format=html -output-dir=cov_html \
    ./include \ # include以下にフィルタ
    foo.cc # ファイル単位でフィルタ
```

その他設定できる項目については[公式ドキュメント](https://llvm.org/docs/CommandGuide/llvm-cov.html#id5)を参照


## CMakeに組み込む

カバレッジが取りたいターゲットに前述のコンパイルオプションを組み込むだけでできる

> mcdc計測のために`-fcoverage-mcdc`、最適化防止とデバッグ情報を付与するために`-O0 -g`を追加している

```cmake
target_compile_options(target PUBLIC -fprofile-instr-generate -fcoverage-mapping -fcoverage-mcdc -O0 -g)
target_link_options(target PUBLIC -fprofile-instr-generate -fcoverage-mapping -fcoverage-mcdc -O0 -g)
```

<details>

<summary> target_link_optionsが必要な件 </summary>

`target_link_options`がない場合生プロファイルが生成されない。これはCMakeがビルドをコンパイルとビルドに分けているからだと思っている。実際にリンク時にオプションを付けない場合、上の例と同じプログラムでも生プロファイルが生成されない

```bash
 $ clang++ -fprofile-instr-generate -fcoverage-mapping -c foo.cc -o foo.o
 $ clang++ foo.o -o foo
 $ ./foo 
 $ ls | grep profraw # profrawが出力されない
```

当然リンク時にオプションを指定すれば生プロファイルは生成される

```bash
$ clang++ -fprofile-instr-generate -fcoverage-mapping -c foo.cc -o foo.o
$ clang++ -fprofile-instr-generate -fcoverage-mapping foo.o -o foo
$ ./foo 
$ ls | grep profraw
default.profraw
```

ただ、リンク時だけオプションを付けても生プロファイルが生成される。ただし、中身がおかしいのかカバレッジを表示することは出来ない

```bash
$ clang++ -c foo.cc -o foo.o
$ clang++ -fprofile-instr-generate -fcoverage-mapping foo.o -o foo
$ ./foo 
$ ls | grep profraw
default.profraw
$ llvm-profdata merge -sparse default.profraw -o foo.profdata
$ llvm-cov show ./foo -instr-profile=foo.profdata 
error: failed to load coverage: './foo': no coverage data found
```

</details>

後はテストを実行するスクリプトを組むだけ。ここでは`configureMyTarget`でオプションを追加している

```cmake
include(${PROJECT_SOURCE_DIR}/cmake/ConfigureTarget.cmake)

include(FetchContent)
FetchContent_Declare(
    googletest
    URL https://github.com/google/googletest/releases/download/v1.17.0/googletest-1.17.0.tar.gz
)
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)


add_executable(mytests)
target_sources(mytests
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/test_mylib.cpp
)
target_link_libraries(mytests 
    PRIVATE
        gtest_main
        MyLib
)
configureMyTarget(mytests)

include(GoogleTest)
gtest_discover_tests(mytests)

function(addCoverageTarget)
    find_program(LLVM_PROFDATA_BIN NAMES llvm-profdata llvm-profdata-20 llvm-profdata-18)
    find_program(LLVM_COV_BIN NAMES llvm-cov llvm-cov-20 llvm-cov-18)

    if(NOT LLVM_PROFDATA_BIN OR NOT LLVM_COV_BIN)
        message(WARNING "llvm-profdata or llvm-cov not found. Coverage target will not be created.")
        return()
    endif()

    set(COVERAGE_OUTPUT_DIR ${CMAKE_BINARY_DIR}/coverage-report)

    add_custom_target(coverage_clean
        COMMAND ${CMAKE_COMMAND} -E rm -f *.profraw *.profdata 
        COMMAND ${CMAKE_COMMAND} -E rm -rf ${COVERAGE_OUTPUT_DIR}
        WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
        COMMENT "Removing old coverage data"
    )

    add_custom_target(coverage_run_tests
        COMMAND ${CMAKE_COMMAND} -E env LLVM_PROFILE_FILE="${CMAKE_BINARY_DIR}/coverage-%2m.profraw" -- ${CMAKE_CTEST_COMMAND} --output-on-failure
        WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
        DEPENDS mytests coverage_clean
        COMMENT "Building & running tests for coverage"
    )

    set(PROFDATA_FILE "${CMAKE_BINARY_DIR}/coverage.profdata")
    add_custom_target(coverage_merge
        COMMAND ${LLVM_PROFDATA_BIN} merge -sparse ${CMAKE_BINARY_DIR}/*.profraw -o ${PROFDATA_FILE}
        DEPENDS coverage_run_tests
        WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
        COMMENT "Merging coverage data"
    )

    add_custom_target(coverate_report_summary
        COMMAND ${LLVM_COV_BIN} report $<TARGET_FILE:mytests> 
            -instr-profile=${PROFDATA_FILE}
            -Xdemangler=c++filt
            -show-region-summary
            -show-mcdc-summary
            ${PROJECT_SOURCE_DIR}/lib
        DEPENDS coverage_merge
        WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
        COMMENT "Generating coverage report summary"
    )

    add_custom_target(coverage_report_html
        COMMAND ${LLVM_COV_BIN} show $<TARGET_FILE:mytests>
            -instr-profile=${PROFDATA_FILE}
            -Xdemangler=c++filt
            -show-branch-summary
            -show-instantiation-summary
            -show-mcdc-summary
            -show-region-summary
            -show-mcdc
            -show-line-counts-or-regions
            -show-directory-coverage
            -show-instantiations
            -format=html
            -output-dir=${COVERAGE_OUTPUT_DIR}
            ${PROJECT_SOURCE_DIR}/lib
        COMMAND ${CMAKE_COMMAND} -E echo "HTML coverage report generated at: ${COVERAGE_OUTPUT_DIR}"
        DEPENDS coverage_merge
        WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
        COMMENT "Generating HTML coverage report"
    )
    
    if (CMAKE_BUILD_TYPE STREQUAL "Coverage")
        add_custom_target(coverage ALL
            DEPENDS coverate_report_summary coverage_report_html
        )
    else()
        add_custom_target(coverage
            DEPENDS coverate_report_summary coverage_report_html
        )
    endif()

    
endfunction()

addCoverageTarget()
```
