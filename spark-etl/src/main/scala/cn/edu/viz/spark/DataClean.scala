package cn.edu.viz.spark

import org.apache.spark.sql.{SparkSession, DataFrame}
import org.apache.spark.sql.functions._

/**
 * Spark 数据清洗
 * 功能：读取 HDFS 原始 CSV → 清洗（去元数据、去注释、宽表转长表、去空值）→ 写回 HDFS
 *
 * 运行方式：
 *   IDEA 本地：直接运行（master = local[*]）
 *   集群提交：spark-submit --master spark://hadoop101:7020 --class cn.edu.viz.spark.DataClean spark-etl-1.0-SNAPSHOT.jar
 */
object DataClean {

  // HDFS 路径配置
  val RAW_BASE = "hdfs://master:9000/edu-viz/raw"
  val CLEAN_BASE = "hdfs://master:9000/edu-viz/cleaned"

  def main(args: Array[String]): Unit = {

    // ---------- 初始化 Spark ----------
    val spark = SparkSession.builder()
      .appName("EduDataCleaning")
      .master("local[*]")
      .getOrCreate()

    import spark.implicits._

    // ==================== 全国年度数据清洗 ====================
    // 数据集名必须和 HDFS 上的文件/目录名一致
    val nationalDatasets = List(
      "年度数据-各级各类学历教育在校生数（万人）",
      "年度数据-各级各类学历教育招生数（万人）",
      "年度数据-各级各类学历教育毕业生数（万人）"
    )

    nationalDatasets.foreach { dataset =>
      println(s">>> 开始清洗全国数据: $dataset")
      val df = cleanNationalData(spark, dataset)
      // 清洗后用英文名存储，方便后续分析代码引用
      val outputName = dataset match {
        case "年度数据-各级各类学历教育在校生数（万人）" => "national_students"
        case "年度数据-各级各类学历教育招生数（万人）" => "national_enrollment"
        case "年度数据-各级各类学历教育毕业生数（万人）" => "national_graduates"
      }
      df.write.mode("overwrite").option("header", "true").csv(s"$CLEAN_BASE/$outputName")
      println(s"清洗完成: $dataset → $CLEAN_BASE/$outputName")
      df.show(10, truncate = false)
    }

    // ==================== 分省年度数据清洗 ====================
    val provincialDatasets = List(
      "分省年度数据-教育经费（万元）",
      "分省年度数据-普通、职业本专科在校学生数（万人）",
      "分省年度数据-普通、职业本专科招生数（万人）",
      "分省年度数据-普通、职业本专科毕业生数（万人）",
      "分省年度数据-普通、职业本专科授予学位数（万人）",
      "分省年度数据-普通、职业高等学校数（所）"
    )

    provincialDatasets.foreach { dataset =>
      println(s">>> 开始清洗分省数据: $dataset")
      val df = cleanProvincialData(spark, dataset)
      // 清洗后用英文名存储
      val outputName = dataset match {
        case "分省年度数据-教育经费（万元）" => "provincial_funding"
        case "分省年度数据-普通、职业本专科在校学生数（万人）" => "provincial_voc_students"
        case "分省年度数据-普通、职业本专科招生数（万人）" => "provincial_voc_enrollment"
        case "分省年度数据-普通、职业本专科毕业生数（万人）" => "provincial_voc_graduates"
        case "分省年度数据-普通、职业本专科授予学位数（万人）" => "provincial_voc_degrees"
        case "分省年度数据-普通、职业高等学校数（所）" => "provincial_voc_schools"
      }
      df.write.mode("overwrite").option("header", "true").csv(s"$CLEAN_BASE/$outputName")
      println(s"清洗完成: $dataset → $CLEAN_BASE/$outputName")
      df.show(10, truncate = false)
    }

    println("=" * 50)
    println("全部数据清洗完成！")
    println(s"清洗后数据目录: $CLEAN_BASE")
    println("=" * 50)

    spark.stop()
  }

  /**
   * 清洗全国年度数据：宽表转长表
   * 输入格式：指标\t,2025年\t,2024年\t,...
   * 输出格式：indicator | year | value
   */
  def cleanNationalData(spark: SparkSession, datasetName: String): DataFrame = {
    import spark.implicits._

    val rawPath = s"$RAW_BASE/$datasetName"

    // 读取原始文本，过滤元数据和注释
    val lines = spark.read.textFile(rawPath).filter(line =>
      !line.startsWith("数据库：") &&
      !line.startsWith("时间：") &&
      !line.startsWith("注：") &&
      !line.startsWith("数据来源")
    )

    // 解析表头获取年份列名
    val headerRow = lines.first()
    val yearCols = headerRow.split("\t,").map(_.trim).filter(_.nonEmpty).tail

    // 过滤掉表头行，解析每行为 (指标名, Map(年份->值))
    val dataLines = lines.filter(_ != headerRow)

    val rows = dataLines.rdd.flatMap { line =>
      val parts = line.split("\t,").map(_.trim)
      val indicator = parts.headOption.getOrElse("").replaceAll("\\s*\\(.*?\\)\\s*", "").trim
      if (indicator.isEmpty) {
        Seq.empty
      } else {
        // 逐个年份展开为长表行，避免 arrays_zip 长度不一致丢数据
        yearCols.zip(parts.tail).map { case (yearCol, v) =>
          val year = yearCol.replace("年", "")
          (indicator, year, v)
        }
      }
    }

    rows.toDF("indicator", "year", "value")
      .filter(col("value").isNotNull && col("value") =!= "")
  }

  /**
   * 清洗分省年度数据：宽表转长表
   * 输入格式：地区\t,2025年\t,2024年\t,...
   * 输出格式：province | year | value
   */
  def cleanProvincialData(spark: SparkSession, datasetName: String): DataFrame = {
    import spark.implicits._

    val rawPath = s"$RAW_BASE/$datasetName"

    val lines = spark.read.textFile(rawPath).filter(line =>
      !line.startsWith("数据库：") &&
      !line.startsWith("时间：") &&
      !line.startsWith("数据来源")
    )

    val headerRow = lines.first()
    val yearCols = headerRow.split("\t,").map(_.trim).filter(_.nonEmpty).tail

    val dataLines = lines.filter(_ != headerRow)

    val rows = dataLines.rdd.flatMap { line =>
      val parts = line.split("\t,").map(_.trim)
      val province = parts.headOption.getOrElse("")
      if (province.isEmpty) {
        Seq.empty
      } else {
        yearCols.zip(parts.tail).map { case (yearCol, v) =>
          val year = yearCol.replace("年", "")
          (province, year, v)
        }
      }
    }

    rows.toDF("province", "year", "value")
      .filter(col("value").isNotNull && col("value") =!= "")
  }
}
