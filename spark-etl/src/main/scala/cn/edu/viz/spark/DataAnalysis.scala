package cn.edu.viz.spark

import org.apache.spark.sql.{SparkSession, DataFrame, SaveMode}
import org.apache.spark.sql.functions._
import org.apache.spark.sql.types.DoubleType

/**
 * Spark 数据分析：读取 HDFS 清洗后数据 → 多维度分析 → 写入 MySQL
 *
 * 运行方式：
 *   IDEA 本地：直接运行（master = local[*]）
 *   集群提交：spark-submit --master spark://hadoop101:7070 --class cn.edu.viz.spark.DataAnalysis spark-etl-1.0-SNAPSHOT.jar
 */
object DataAnalysis {

  // HDFS 清洗后数据路径
  val CLEAN_BASE = "hdfs://master:9000/edu-viz/cleaned"

  // MySQL 配置（替换为你的实际密码）
  val MYSQL_URL = "jdbc:mysql://localhost:3306/cn_edu_viz?useSSL=false&characterEncoding=UTF-8"
  val MYSQL_PROPS = {
    val props = new java.util.Properties()
    props.setProperty("user", "root")
    props.setProperty("password", "1234")
    props.setProperty("driver", "com.mysql.cj.jdbc.Driver")
    props
  }

  def main(args: Array[String]): Unit = {

    val spark = SparkSession.builder()
      .appName("EduDataAnalysis")
      .master("local[*]")
      .getOrCreate()

    import spark.implicits._

    // ==================== 读取所有清洗后数据 ====================
    val dfStudents = readNational(spark, "national_students")
    val dfEnrollment = readNational(spark, "national_enrollment")
    val dfGraduates = readNational(spark, "national_graduates")

    val dfFunding = readProvincial(spark, "provincial_funding")
    val dfVocStudents = readProvincial(spark, "provincial_voc_students")
    val dfVocEnrollment = readProvincial(spark, "provincial_voc_enrollment")
    val dfVocGraduates = readProvincial(spark, "provincial_voc_graduates")
    val dfVocDegrees = readProvincial(spark, "provincial_voc_degrees")
    val dfVocSchools = readProvincial(spark, "provincial_voc_schools")

    // ==================== 分析1~3：全国在校生/招生/毕业生趋势 ====================
    runAnalysis(dfStudents, List(
      "研究生在校学生数",
      "普通、职业本专科在校学生数",
      "高中阶段教育在校学生数",
      "初中阶段教育在校学生数",
      "普通小学在校学生数",
      "学前教育在校学生数"
    ), "students_trend", "全国在校生数年度趋势")

    runAnalysis(dfEnrollment, List(
      "研究生招生数",
      "普通、职业本专科招生数",
      "普通本科招生数",
      "专科招生数",
      "普通高中招生数",
      "中等职业教育招生数",
      "普通小学招生数",
      "学前教育招生数"
    ), "enrollment_trend", "全国招生数年度趋势")

    runAnalysis(dfGraduates, List(
      "研究生毕业生数",
      "普通、职业本专科毕业生数",
      "普通本科毕业生数",
      "专科毕业生数",
      "普通高中毕业生数",
      "中等职业教育毕业生数",
      "普通小学毕业生数",
      "学前教育毕业生数"
    ), "graduates_trend", "全国毕业生数年度趋势")

    // ==================== 分析4：研究生 vs 本专科对比 ====================
    println(">>> 分析4：研究生与本专科增长对比")
    val gradStudents = dfStudents.filter(col("indicator") === "研究生在校学生数").select(col("year"), col("value").alias("graduate_students"))
    val undergradStudents = dfStudents.filter(col("indicator") === "普通、职业本专科在校学生数").select(col("year"), col("value").alias("undergrad_students"))
    val comparison = gradStudents.join(undergradStudents, Seq("year"), "inner").orderBy("year")
    comparison.show(20, truncate = false)
    saveToMysql(comparison, "grad_vs_undergrad")

    // ==================== 分析5~10：分省数据直接入库 ====================
    saveOrdered(dfFunding, "provincial_funding", "分省教育经费")
    saveOrdered(dfVocStudents, "provincial_students", "分省本专科在校生数")
    saveOrdered(dfVocEnrollment, "provincial_enrollment", "分省本专科招生数")
    saveOrdered(dfVocGraduates, "provincial_graduates", "分省本专科毕业生数")
    saveOrdered(dfVocDegrees, "provincial_degrees", "分省学位授予数")
    saveOrdered(dfVocSchools, "provincial_schools", "分省高等学校数")

    // ==================== 分析11：高中阶段结构（普高 vs 中职）====================
    println(">>> 分析11：高中阶段教育结构分析")
    val seniorHigh = dfStudents.filter(col("indicator") === "普通高中在校学生数").select(col("year"), col("value").alias("senior_high"))
    val vocational = dfStudents.filter(col("indicator") === "中等职业教育在校学生数").select(col("year"), col("value").alias("vocational"))
    val highStructure = seniorHigh.join(vocational, Seq("year"), "inner").orderBy("year")
    highStructure.show(20, truncate = false)
    saveToMysql(highStructure, "high_school_structure")

    // ==================== 分析12：义务教育趋势（初中 + 小学）====================
    println(">>> 分析12：义务教育趋势分析")
    val juniorHigh = dfStudents.filter(col("indicator") === "初中阶段教育在校学生数").select(col("year"), col("value").alias("junior_high"))
    val primarySchool = dfStudents.filter(col("indicator") === "普通小学在校学生数").select(col("year"), col("value").alias("primary_school"))
    val compulsory = juniorHigh.join(primarySchool, Seq("year"), "inner").orderBy("year")
    compulsory.show(20, truncate = false)
    saveToMysql(compulsory, "compulsory_education_trend")

    println("=" * 50)
    println("全部分析完成，结果已写入 MySQL！")
    println("=" * 50)

    spark.stop()
  }

  /** 全国数据通用分析：按指标筛选 → 排序 → 展示 → 入库 */
  def runAnalysis(df: DataFrame, indicators: List[String], table: String, desc: String): Unit = {
    println(s">>> 分析：$desc")
    val result = df.filter(col("indicator").isin(indicators: _*)).orderBy("indicator", "year")
    result.show(20, truncate = false)
    saveToMysql(result, table)
  }

  /** 分省数据通用操作：排序 → 展示 → 入库 */
  def saveOrdered(df: DataFrame, table: String, desc: String): Unit = {
    println(s">>> 分析：$desc")
    val ordered = df.orderBy("province", "year")
    ordered.show(20, truncate = false)
    saveToMysql(ordered, table)
  }

  /** 读取全国年度清洗后数据（长表格式） */
  def readNational(spark: SparkSession, datasetName: String): DataFrame = {
    spark.read.option("header", "true").csv(s"$CLEAN_BASE/$datasetName")
      .withColumn("value", regexp_replace(trim(col("value")), ",", "").cast(DoubleType))
      .withColumn("year", col("year").cast("int"))
      .filter(col("value").isNotNull)
  }

  /** 读取分省年度清洗后数据（长表格式） */
  def readProvincial(spark: SparkSession, datasetName: String): DataFrame = {
    spark.read.option("header", "true").csv(s"$CLEAN_BASE/$datasetName")
      .withColumn("value", regexp_replace(trim(col("value")), ",", "").cast(DoubleType))
      .withColumn("year", col("year").cast("int"))
      .filter(col("value").isNotNull)
  }

  /** 将 DataFrame 写入 MySQL */
  def saveToMysql(df: DataFrame, tableName: String): Unit = {
    df.write.mode(SaveMode.Overwrite).jdbc(MYSQL_URL, tableName, MYSQL_PROPS)
    println(s"✅ 已写入 MySQL 表: $tableName")
  }
}
